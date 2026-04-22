// 地图编辑器核心对象
const MapEditor = {
	// 地图数据
	mapData: {
		mapId: "level_01",
		mapName: "新手关卡",
		defCellWidth: 60,
		defCellHeight: 64,
		time: 12,
		fogCols: 0,
		startFrame: 0,
		defBgm: 1,
		terrain: 0,
		gridCols: 9,
		gridRows: 5,
		background: {
			lib: "backgrounds",
			img: "bg_grassland",
			offsetX: 0,
			offsetY: 0
		},
		foreground: {
			lib: "foregrounds",
			img: "fg_trees",
			x: 0,
			y: 0
		},
		sunlight: {
			drop: true,
			baseCount: 25,
			maxCount: 9999,
			escape: 600,
			dealt: 550,
			mode: 1
		},
		cells: [],
		waves: [],
		effects: [],
		carts: [],
		platformGroups: [],        // 移动平台组
		cottonCandyZones: [],      // 棉花糖区域
		cottonCandyHoleGen: {
		    mode: "timed",   // "columnRandom" 或 "timed"
		    interval: 30.0
		},
		timeLimit: {
			enabled: false,
			seconds: 60
		}
	},

	// 当前选中的单元格
	selectedCell: null,

	// 当前选中的单元格类型
	selectedCellType: 0,

	// 单元格类型配置
	cellTypes: [{
			id: 0,
			name: "普通",
			color: "#2a9d8f",
			className: "grass"
		},
		{
			id: 1,
			name: "水上",
			color: "#264653",
			className: "water"
		},
		{
			id: 2,
			name: "洞穴",
			color: "#6d6875",
			className: "hole"
		},
		{
			id: 3,
			name: "岩石",
			color: "#b7b7a4",
			className: "stone"
		},
		{
			id: 4,
			name: "熔岩",
			color: "#e76f51",
			className: "lava"
		},
		{
			id: 5,
			name: "天空",
			color: "#a2d2ff",
			className: "sky"
		},
		{
			id: 6,
			name: "水下",
			color: "#1d3557",
			className: "inwater"
		}
	],

	// 天气类型
	weatherTypes: [{
			id: 0,
			name: "无"
		},
		{
			id: 1,
			name: "雾"
		}
	],

	// 初始化
	init: function() {
		this.loadDefaultMap();
		this.bindEvents();
		this.renderGrid();
		this.renderEffectsUI();
		this.updateUI();
		this.initWaveEditModalEvents();
		this.renderCottonCandyZonesUI();
		this.renderPlatformGroupsUI();
		// 初始化右侧面板标签页状态
		this.switchTab('cell'); // 默认激活单元格属性标签页
	},

	// 在 MapEditor 初始化时，为模态框绑定一次保存事件
	initWaveEditModalEvents: function() {
		const modal = document.getElementById('waveEditModal');
		modal.addEventListener('click', (e) => {
			if (e.target.id === 'saveWaveBtn' || e.target.closest('#saveWaveBtn')) {
				const waveIndex = parseInt(modal.dataset.waveIndex);
				this.saveWaveConfig(waveIndex, modal);
			}
		});
	},

	// 加载默认地图
	loadDefaultMap: function() {
		// 初始化单元格
		this.mapData.cells = [];
		for (let row = 0; row < this.mapData.gridRows; row++) {
			this.mapData.cells[row] = [];
			for (let col = 0; col < this.mapData.gridCols; col++) {
				// 创建默认的普通单元格
				this.mapData.cells[row][col] = {
					x: col,
					y: row,
					width: 1,
					height: 1,
					type: this.mapData.terrain || 0, // 使用mapData.terrain或默认0
					weather: 0, // 无天气
					virtualZ: 0.0,
					prePlant: []
				};
			}
		}

		// 设置一些示例道路
		for (let col = 0; col < this.mapData.gridCols; col++) {
			this.mapData.cells[2][col].type = 0; // 普通
		}

		// 添加示例Effects
		this.mapData.effects = [];

		// 添加一些示例波次
		this.mapData.waves = [];

		this.mapData.carts = [];

		// 确保Sunlight有所有必要的字段
		this.mapData.sunlight = this.mapData.sunlight || {};
		this.mapData.sunlight.escape = this.mapData.sunlight.escape || 600;
		this.mapData.sunlight.dealt = this.mapData.sunlight.dealt || 550;
		this.mapData.sunlight.mode = this.mapData.sunlight.mode || 1;

		// 确保desc对象有所有必要的字段
		this.mapData.desc = this.mapData.desc || {};
		this.mapData.desc.Text = this.mapData.desc.Text || "地图名\\天气\\模式\\攻击波数";
		this.mapData.desc.DescLib = this.mapData.desc.DescLib || "";
		this.mapData.desc.DescImage = this.mapData.desc.DescImage || "";
		this.mapData.desc.DescMon = this.mapData.desc.DescMon || [];
		this.mapData.desc.DescBoss = this.mapData.desc.DescBoss || "";
		this.mapData.desc.DescBossLib = this.mapData.desc.DescBossLib || "";
		this.mapData.desc.DescBossImage = this.mapData.desc.DescBossImage || "";
	},
	
	// 添加平台组
	addPlatformGroup: function() {
	    const newGroup = {
	        start_frame: 0,
	        loop: false,
	        image_lib: "",
	        image: "",
	        cells: [],        // 格式: {row, col}
	        steps: []         // 格式: {offset_x, offset_y, move_duration, pause_duration}
	    };
	    this.mapData.platformGroups.push(newGroup);
	    this.renderPlatformGroupsUI();
	    this.editPlatformGroup(this.mapData.platformGroups.length - 1);
	},
	
	// 编辑平台组（复杂，使用多标签页）
	editPlatformGroup: function(index) {
	    const group = this.mapData.platformGroups[index];
	    
	    // 构建单元格选择器（使用当前网格行列）
	    let cellsHtml = '';
	    for (let r = 0; r < this.mapData.gridRows; r++) {
	        for (let c = 0; c < this.mapData.gridCols; c++) {
	            const isSelected = group.cells.some(cell => cell.row === r && cell.col === c);
	            cellsHtml += `<label style="display:inline-block; margin:2px;">
	                <input type="checkbox" class="platform-cell-check" data-row="${r}" data-col="${c}" ${isSelected ? 'checked' : ''}> (${r},${c})
	            </label>`;
	        }
	        cellsHtml += '<br>';
	    }
	    
	    // 构建步骤列表
	    let stepsHtml = '';
	    group.steps.forEach((step, stepIdx) => {
	        stepsHtml += `<div class="wave-item" style="margin-bottom:10px;">
	            <div class="wave-header">
	                <span>步骤 ${stepIdx+1}</span>
	                <button class="btn delete-step" data-step="${stepIdx}" style="padding:2px 5px;"><i class="fas fa-trash"></i></button>
	            </div>
	            <div>偏移X: <input type="number" class="step-offset-x" value="${step.offset_x}" step="0.1" style="width:80px;"></div>
	            <div>偏移Y: <input type="number" class="step-offset-y" value="${step.offset_y}" step="0.1" style="width:80px;"></div>
	            <div>移动时间: <input type="number" class="step-move-dur" value="${step.move_duration}" step="0.1" style="width:80px;"></div>
	            <div>暂停时间: <input type="number" class="step-pause-dur" value="${step.pause_duration}" step="0.1" style="width:80px;"></div>
	        </div>`;
	    });
	    
	    const content = `
	        <div class="tab-container" style="margin-bottom:10px;">
	            <div class="tab active" data-tab="basic">基础</div>
	            <div class="tab" data-tab="cells">格子</div>
	            <div class="tab" data-tab="steps">步骤</div>
	        </div>
	        <div id="basic-tab" class="tab-pane active">
	            <div class="form-group">
	                <label>起始帧</label>
	                <input type="number" id="pgStartFrame" class="form-control" value="${group.start_frame}">
	            </div>
	            <div class="form-group">
	                <label><input type="checkbox" id="pgLoop" ${group.loop ? 'checked' : ''}> 循环移动</label>
	            </div>
	            <div class="form-group">
	                <label>图像库</label>
	                <input type="text" id="pgImageLib" class="form-control" value="${group.image_lib}">
	            </div>
	            <div class="form-group">
	                <label>图像ID</label>
	                <input type="text" id="pgImage" class="form-control" value="${group.image}">
	            </div>
	        </div>
	        <div id="cells-tab" class="tab-pane" style="max-height:300px; overflow-y:auto;">
	            <div class="form-group">
	                <button id="selectAllCellsBtn" class="btn" style="margin-bottom:5px;">全选</button>
	                <button id="clearAllCellsBtn" class="btn">清空</button>
	                <div id="cellsCheckboxContainer">${cellsHtml}</div>
	            </div>
	        </div>
	        <div id="steps-tab" class="tab-pane">
	            <button id="addStepBtn" class="btn btn-primary" style="margin-bottom:10px;"><i class="fas fa-plus"></i> 添加步骤</button>
	            <div id="stepsContainer">${stepsHtml || '暂无步骤'}</div>
	        </div>
	    `;
	    
	    const modal = this.createModal('编辑平台组', content, () => {
	        // 保存基础设置
	        group.start_frame = parseInt(document.getElementById('pgStartFrame').value) || 0;
	        group.loop = document.getElementById('pgLoop').checked;
	        group.image_lib = document.getElementById('pgImageLib').value;
	        group.image = document.getElementById('pgImage').value;
	        
	        // 保存格子选择
	        group.cells = [];
	        modal.querySelectorAll('.platform-cell-check:checked').forEach(cb => {
	            group.cells.push({
	                row: parseInt(cb.dataset.row),
	                col: parseInt(cb.dataset.col)
	            });
	        });
	        
	        // 保存步骤（从动态输入框读取）
	        group.steps = [];
	        modal.querySelectorAll('#stepsContainer .wave-item').forEach(item => {
	            group.steps.push({
	                offset_x: parseFloat(item.querySelector('.step-offset-x').value) || 0,
	                offset_y: parseFloat(item.querySelector('.step-offset-y').value) || 0,
	                move_duration: parseFloat(item.querySelector('.step-move-dur').value) || 1,
	                pause_duration: parseFloat(item.querySelector('.step-pause-dur').value) || 0
	            });
	        });
	        
	        this.renderPlatformGroupsUI();
	    });
	    
	    // 绑定标签页切换
	    modal.querySelectorAll('.tab').forEach(tab => {
	        tab.addEventListener('click', () => {
	            const tabId = tab.dataset.tab;
	            modal.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
	            modal.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
	            tab.classList.add('active');
	            modal.querySelector(`#${tabId}-tab`).classList.add('active');
	        });
	    });
	    
	    // 绑定全选/清空格子
	    modal.querySelector('#selectAllCellsBtn').addEventListener('click', () => {
	        modal.querySelectorAll('.platform-cell-check').forEach(cb => cb.checked = true);
	    });
	    modal.querySelector('#clearAllCellsBtn').addEventListener('click', () => {
	        modal.querySelectorAll('.platform-cell-check').forEach(cb => cb.checked = false);
	    });
	    
	    // 绑定添加步骤按钮
	    modal.querySelector('#addStepBtn').addEventListener('click', () => {
	        const container = modal.querySelector('#stepsContainer');
	        const stepIdx = container.querySelectorAll('.wave-item').length;
	        const stepHtml = `<div class="wave-item" style="margin-bottom:10px;">
	            <div class="wave-header">
	                <span>步骤 ${stepIdx+1}</span>
	                <button class="btn delete-step" data-step="${stepIdx}" style="padding:2px 5px;"><i class="fas fa-trash"></i></button>
	            </div>
	            <div>偏移X: <input type="number" class="step-offset-x" value="0" step="0.1" style="width:80px;"></div>
	            <div>偏移Y: <input type="number" class="step-offset-y" value="0" step="0.1" style="width:80px;"></div>
	            <div>移动时间: <input type="number" class="step-move-dur" value="1" step="0.1" style="width:80px;"></div>
	            <div>暂停时间: <input type="number" class="step-pause-dur" value="0" step="0.1" style="width:80px;"></div>
	        </div>`;
	        container.insertAdjacentHTML('beforeend', stepHtml);
	        // 为新删除按钮绑定事件
	        container.lastElementChild.querySelector('.delete-step').addEventListener('click', function() {
	            this.closest('.wave-item').remove();
	        });
	    });
	    
	    // 为现有删除步骤按钮绑定事件
	    modal.querySelectorAll('.delete-step').forEach(btn => {
	        btn.addEventListener('click', function() {
	            this.closest('.wave-item').remove();
	        });
	    });
	    
	    document.body.appendChild(modal);
	},
	
	// 删除平台组
	deletePlatformGroup: function(index) {
	    if (confirm('确定删除此平台组吗？')) {
	        this.mapData.platformGroups.splice(index, 1);
	        this.renderPlatformGroupsUI();
	    }
	},
	
	// 完善渲染函数
	renderPlatformGroupsUI: function() {
	    const container = document.getElementById('platformGroupsContainer');
	    if (!container) return;
	    if (!this.mapData.platformGroups) return;
	    let html = '';
	    this.mapData.platformGroups.forEach((group, idx) => {
	        html += `<div class="wave-item" data-index="${idx}">
	            <div class="wave-header">
	                <div class="wave-title">平台组 ${idx+1}</div>
	                <div>
	                    <button class="btn edit-platform-group" style="padding:2px 5px;"><i class="fas fa-edit"></i></button>
	                    <button class="btn btn-danger delete-platform-group" style="padding:2px 5px;"><i class="fas fa-trash"></i></button>
	                </div>
	            </div>
	            <div class="task-item">
	                <div>起始帧: ${group.start_frame || 0}</div>
	                <div>循环: ${group.loop ? '是' : '否'}</div>
	                <div>格子数: ${group.cells ? group.cells.length : 0}</div>
	                <div>步骤数: ${group.steps ? group.steps.length : 0}</div>
	            </div>
	        </div>`;
	    });
	    container.innerHTML = html || '<div class="form-control" style="text-align:center;">暂无平台组</div>';
	    
	    container.querySelectorAll('.edit-platform-group').forEach(btn => {
	        btn.addEventListener('click', (e) => {
	            const idx = parseInt(e.target.closest('.wave-item').dataset.index);
	            this.editPlatformGroup(idx);
	        });
	    });
	    container.querySelectorAll('.delete-platform-group').forEach(btn => {
	        btn.addEventListener('click', (e) => {
	            const idx = parseInt(e.target.closest('.wave-item').dataset.index);
	            this.deletePlatformGroup(idx);
	        });
	    });
	},

	// 绑定事件
	bindEvents: function() {
		// 网格大小调整
		document.getElementById('resizeGridBtn').addEventListener('click', () => {
			this.resizeGrid();
		});

		document.getElementById('gridCols').addEventListener('change', () => {
			this.updateMapTitle();
		});

		document.getElementById('gridRows').addEventListener('change', () => {
			this.updateMapTitle();
		});

		// 清空网格
		document.getElementById('clearGridBtn').addEventListener('click', () => {
			if (confirm("确定要清空所有单元格吗？")) {
				this.clearGrid();
			}
		});

		// 填充网格
		document.getElementById('fillGridBtn').addEventListener('click', () => {
			if (confirm(`确定要将所有单元格填充为${this.cellTypes[this.selectedCellType].name}吗？`)) {
				this.fillGrid(this.selectedCellType);
			}
		});
		
		document.getElementById('quickWaveBtn').addEventListener('click', () => {
		    this.showQuickWaveModal();
		});
		
		const modal = document.getElementById('templateWaveModal');
		modal.querySelectorAll('.close-modal').forEach(btn => {
			btn.addEventListener('click', () => modal.style.display = 'none');
		});
		modal.addEventListener('click', (e) => {
			if (e.target === modal) modal.style.display = 'none';
		});
		
		// 绑定添加中场BOSS按钮事件
		document.getElementById('addMidBossBtn').addEventListener('click', () => {
			this.addMidBossRow();
		});

		// 单元格类型选择
		document.querySelectorAll('.list-item[data-type]').forEach(item => {
			item.addEventListener('click', (e) => {
				const type = parseInt(e.currentTarget.dataset.type);
				this.setSelectedCellType(type);
			});
		});

		// 单元格属性更新
		document.getElementById('cellType').addEventListener('change', (e) => {
			if (this.selectedCell) {
				this.updateSelectedCellProperty('type', parseInt(e.target.value));
			}
		});
		
		// 进阶属性
		document.getElementById('defExp').addEventListener('change', (e) => {
		    this.mapData.defExp = parseInt(e.target.value);
		});
		document.getElementById('defExpDelta').addEventListener('change', (e) => {
		    this.mapData.defExpDelta = parseInt(e.target.value);
		});
		document.getElementById('warnMsg').addEventListener('change', (e) => {
		    this.mapData.warnMsg = e.target.value||"";
		});
		
		// 洞穴设置
		document.getElementById('holeCol').addEventListener('change', (e) => {
		    this.mapData.holeCol = parseInt(e.target.value);
		});
		document.getElementById('holeMon').addEventListener('change', (e) => {
		    const value = e.target.value;
		    this.mapData.holeMon = value ? value.split(',').map(s => s.trim()) : [];
		});
		document.getElementById('holeGenBase').addEventListener('change', (e) => {
		    this.mapData.holeGenBase = parseInt(e.target.value);
		});
		document.getElementById('holeGenDelta').addEventListener('change', (e) => {
		    this.mapData.holeGenDelta = parseInt(e.target.value);
		});
		document.getElementById('holeSpawnBase').addEventListener('change', (e) => {
		    this.mapData.holeSpawnBase = parseInt(e.target.value);
		});
		document.getElementById('holeSpawnDelta').addEventListener('change', (e) => {
		    this.mapData.holeSpawnDelta = parseInt(e.target.value);
		});

		document.getElementById('cellWeather').addEventListener('change', (e) => {
			if (this.selectedCell) {
				this.updateSelectedCellProperty('weather', parseInt(e.target.value));
			}
		});

		document.getElementById('cellVirtualZ').addEventListener('change', (e) => {
			if (this.selectedCell) {
				this.updateSelectedCellProperty('virtualZ', parseFloat(e.target.value));
			}
		});

		document.getElementById('cellWidth').addEventListener('change', (e) => {
			if (this.selectedCell) {
				this.updateSelectedCellProperty('width', parseInt(e.target.value));
			}
		});

		document.getElementById('cellHeight').addEventListener('change', (e) => {
			if (this.selectedCell) {
				this.updateSelectedCellProperty('height', parseInt(e.target.value));
			}
		});

		// 地图属性更新
		document.getElementById('mapId').addEventListener('change', (e) => {
			this.mapData.mapId = e.target.value;
		});

		document.getElementById('mapName').addEventListener('change', (e) => {
			this.mapData.mapName = e.target.value;
			this.updateMapTitle();
		});

		document.getElementById('defCellWidth').addEventListener('change', (e) => {
			this.mapData.defCellWidth = parseInt(e.target.value);
			this.renderGrid();
		});

		document.getElementById('defCellHeight').addEventListener('change', (e) => {
			this.mapData.defCellHeight = parseInt(e.target.value);
			this.renderGrid();
		});

		document.getElementById('time').addEventListener('change', (e) => {
			this.mapData.time = parseInt(e.target.value);
		});

		document.getElementById('fogCols').addEventListener('change', (e) => {
			this.mapData.fogCols = parseInt(e.target.value);
		});

		document.getElementById('startFrame').addEventListener('change', (e) => {
			this.mapData.startFrame = parseInt(e.target.value);
		});

		document.getElementById('terrainType').addEventListener('change', (e) => {
			this.mapData.terrain = parseInt(e.target.value);
		});

		// 资源设置更新
		document.getElementById('backgroundLib').addEventListener('change', (e) => {
			this.mapData.background.lib = e.target.value;
		});

		document.getElementById('backgroundImage').addEventListener('change', (e) => {
			this.mapData.background.img = e.target.value;
		});

		document.getElementById('backgroundOffsetX').addEventListener('change', (e) => {
			this.mapData.background.offsetX = parseInt(e.target.value);
		});

		document.getElementById('backgroundOffsetY').addEventListener('change', (e) => {
			this.mapData.background.offsetY = parseInt(e.target.value);
		});

		document.getElementById('foregroundLib').addEventListener('change', (e) => {
			this.mapData.foreground.lib = e.target.value;
		});

		document.getElementById('foregroundImage').addEventListener('change', (e) => {
			this.mapData.foreground.img = e.target.value;
		});

		document.getElementById('foregroundOffsetX').addEventListener('change', (e) => {
			this.mapData.foreground.x = parseInt(e.target.value);
		});

		document.getElementById('foregroundOffsetY').addEventListener('change', (e) => {
			this.mapData.foreground.y = parseInt(e.target.value);
		});

		document.getElementById('generateSunlight').addEventListener('change', (e) => {
			this.mapData.sunlight.drop = e.target.value === 'true';
		});

		document.getElementById('maxSunlight').addEventListener('change', (e) => {
			this.mapData.sunlight.maxCount = parseInt(e.target.value);
		});

		document.getElementById('currentFireCount').addEventListener('change', (e) => {
			this.mapData.sunlight.baseCount = parseInt(e.target.value);
		});

		document.getElementById('defBgm').addEventListener('change', (e) => {
			this.mapData.defBgm = parseInt(e.target.value);
		});

		// 保存地图
		document.getElementById('saveMapBtn').addEventListener('click', () => {
			this.saveMap();
		});

		// JSON操作
		document.getElementById('exportJsonBtn').addEventListener('click', () => {
			this.showJsonModal();
		});

		document.getElementById('importJsonBtn').addEventListener('click', () => {
			this.importJson();
		});
		
		document.getElementById('holeGenMode').addEventListener('change', (e) => {
		    const mode = e.target.value;
		    this.mapData.cottonCandyHoleGen.mode = mode;
		    const intervalGroup = document.getElementById('timedIntervalGroup');
		    intervalGroup.style.display = mode === 'timed' ? 'block' : 'none';
		});
		document.getElementById('timedInterval').addEventListener('change', (e) => {
		    this.mapData.cottonCandyHoleGen.interval = parseFloat(e.target.value);
		});

		// 标签页切换
		// document.querySelectorAll('.tab').forEach(tab => {
		// 	tab.addEventListener('click', (e) => {
		// 		const tabId = e.currentTarget.dataset.tab;
		// 		this.switchTab(tabId);
		// 	});
		// });

		document.querySelector('.right-panel .tab-container').addEventListener('click', (e) => {
			if (e.target.classList.contains('tab')) {
				const tabId = e.target.dataset.tab;
				this.switchTab(tabId);
			}
		});

		// 模态框关闭
		document.querySelectorAll('.close-modal').forEach(closeBtn => {
			closeBtn.addEventListener('click', () => {
				document.querySelectorAll('.modal').forEach(modal => {
					modal.style.display = 'none';
					// if (modal.id === 'waveEditModal') {
					//     // 波次编辑模态框需要特别处理
					//     if (confirm('关闭波次编辑？未保存的更改将会丢失。')) {
					//         modal.display = 'none';
					//     }
					// } else if (modal.id === 'jsonModal' || modal.id === 'luaModal') {
					//     // JSON和Lua模态框可以直接关闭
					//     modal.display = 'none';
					// }
				});
			});
		});
		
		const templateBtn = document.getElementById('templateWaveBtn');
		if (templateBtn) {
		    templateBtn.addEventListener('click', () => {
		        this.showTemplateWaveModal();
		    });
		}

		// 点击模态框外部关闭
		window.addEventListener('click', (e) => {
			if (e.target.classList.contains('modal')) {
				// 检查模态框中是否有未保存的更改
				const modalId = e.target.id;
				if (modalId === 'waveEditModal') {
					// 波次编辑模态框需要特别处理
					if (confirm('关闭波次编辑？未保存的更改将会丢失。')) {
						e.target.style.display = 'none';
					}
				} else if (modalId === 'jsonModal' || modalId === 'luaModal') {
					// JSON和Lua模态框可以直接关闭
					e.target.style.display = 'none';
				}
			}
		});

		// 波次操作
		document.getElementById('addWaveBtn').addEventListener('click', () => {
			this.addWave();
		});

		// 地图控制
		document.getElementById('zoomInBtn').addEventListener('click', () => {
			this.zoomGrid(1.1);
		});

		document.getElementById('zoomOutBtn').addEventListener('click', () => {
			this.zoomGrid(0.9);
		});

		document.getElementById('centerMapBtn').addEventListener('click', () => {
			this.centerGrid();
		});

		// 新建地图
		document.getElementById('newMapBtn').addEventListener('click', () => {
			if (confirm("创建新地图将丢失当前未保存的更改，确定继续吗？")) {
				this.newMap();
			}
		});

		// 加载地图
		document.getElementById('loadMapBtn').addEventListener('click', () => {
			this.loadMap();
		});

		// 复制JSON
		document.getElementById('copyJsonBtn').addEventListener('click', () => {
			this.copyJsonToClipboard();
		});

		// 加载JSON
		document.getElementById('loadJsonBtn').addEventListener('click', () => {
			this.loadJsonFromText();
		});

		// 添加特效按钮
		document.getElementById('addEffectBtn').addEventListener('click', () => {
			this.addEffect();
		});

		// Lua Table操作
		document.getElementById('exportLuaBtn').addEventListener('click', () => {
			this.showLuaModal();
		});

		document.getElementById('copyLuaBtn').addEventListener('click', () => {
			this.copyLuaToClipboard();
		});

		document.getElementById('downloadLuaBtn').addEventListener('click', () => {
			this.downloadLuaFile();
		});

		// Lua模态框关闭按钮
		document.querySelector('.close-lua-modal').addEventListener('click', () => {
			document.getElementById('luaModal').style.display = 'none';
		});

		// 点击Lua模态框外部关闭
		document.getElementById('luaModal').addEventListener('click', (e) => {
			if (e.target === document.getElementById('luaModal')) {
				document.getElementById('luaModal').style.display = 'none';
			}
		});


		// 在bindEvents函数中添加Desc相关事件
		document.getElementById('descText').addEventListener('change', (e) => {
			this.mapData.desc.Text = e.target.value;
		});

		document.getElementById('descLib').addEventListener('change', (e) => {
			this.mapData.desc.DescLib = e.target.value;
		});

		document.getElementById('descImage').addEventListener('change', (e) => {
			this.mapData.desc.DescImage = e.target.value;
		});

		document.getElementById('descMon').addEventListener('change', (e) => {
			const value = e.target.value;
			this.mapData.desc.DescMon = value ? value.split(',').map(s => s.trim()) : [];
		});

		document.getElementById('descBoss').addEventListener('change', (e) => {
			this.mapData.desc.DescBoss = e.target.value;
		});

		document.getElementById('descBossLib').addEventListener('change', (e) => {
			this.mapData.desc.DescBossLib = e.target.value;
		});

		document.getElementById('descBossImage').addEventListener('change', (e) => {
			this.mapData.desc.DescBossImage = e.target.value;
		});
		
		// 限时模式事件
		document.getElementById('timeLimitEnabled').addEventListener('change', (e) => {
		  const enabled = e.target.value === 'true';
		  this.mapData.timeLimit.enabled = enabled;
		  const secondsGroup = document.getElementById('timeLimitSecondsGroup');
		  secondsGroup.style.display = enabled ? 'block' : 'none';
		});
		
		document.getElementById('timeLimitSeconds').addEventListener('change', (e) => {
		  this.mapData.timeLimit.seconds = parseInt(e.target.value) || 60;
		});
		
		// 棉花糖区域
		document.getElementById('addCottonCandyZoneBtn').addEventListener('click', () => {
		    this.addCottonCandyZone();
		});
		// 平台组
		document.getElementById('addPlatformGroupBtn').addEventListener('click', () => {
		    this.addPlatformGroup();
		});
		
		// 阳光新参数
		document.getElementById('sunlightEscape').addEventListener('change', (e) => {
		    this.mapData.sunlight.escape = parseInt(e.target.value);
		});
		document.getElementById('sunlightDealt').addEventListener('change', (e) => {
		    this.mapData.sunlight.dealt = parseInt(e.target.value);
		});
		document.getElementById('sunlightMode').addEventListener('change', (e) => {
		    this.mapData.sunlight.mode = parseInt(e.target.value);
		});
		
	},
	
	// 添加棉花糖区域
	addCottonCandyZone: function() {
	    const newZone = {
	        start_row: 0,
	        end_row: 0,
	        start_col: 0,
	        end_col: 0
	    };
	    this.mapData.cottonCandyZones.push(newZone);
	    this.renderCottonCandyZonesUI();
	    // 自动打开编辑对话框（可选）
	    this.editCottonCandyZone(this.mapData.cottonCandyZones.length - 1);
	},
	
	// 编辑棉花糖区域
	editCottonCandyZone: function(index) {
	    const zone = this.mapData.cottonCandyZones[index];
	    const html = `
	        <div class="form-group">
	            <label>起始行</label>
	            <input type="number" id="zoneStartRow" class="form-control" value="${zone.start_row}" min="0" max="${this.mapData.gridRows-1}">
	        </div>
	        <div class="form-group">
	            <label>结束行</label>
	            <input type="number" id="zoneEndRow" class="form-control" value="${zone.end_row}" min="0" max="${this.mapData.gridRows-1}">
	        </div>
	        <div class="form-group">
	            <label>起始列</label>
	            <input type="number" id="zoneStartCol" class="form-control" value="${zone.start_col}" min="0" max="${this.mapData.gridCols-1}">
	        </div>
	        <div class="form-group">
	            <label>结束列</label>
	            <input type="number" id="zoneEndCol" class="form-control" value="${zone.end_col}" min="0" max="${this.mapData.gridCols-1}">
	        </div>
	    `;
	
	    const modal = this.createModal('编辑棉花糖区域', html, () => {
	        zone.start_row = parseInt(document.getElementById('zoneStartRow').value);
	        zone.end_row = parseInt(document.getElementById('zoneEndRow').value);
	        zone.start_col = parseInt(document.getElementById('zoneStartCol').value);
	        zone.end_col = parseInt(document.getElementById('zoneEndCol').value);
	        this.renderCottonCandyZonesUI();
	    });
	    document.body.appendChild(modal);
	},
	
	// 删除棉花糖区域
	deleteCottonCandyZone: function(index) {
	    if (confirm('确定删除此棉花糖区域吗？')) {
	        this.mapData.cottonCandyZones.splice(index, 1);
	        this.renderCottonCandyZonesUI();
	    }
	},
	
	// 通用模态框创建辅助函数（避免重复代码）
	createModal: function(title, content, onSave) {
	    const modal = document.createElement('div');
	    modal.className = 'modal';
	    modal.style.display = 'flex';
	    modal.innerHTML = `
	        <div class="modal-content" style="max-width: 500px;">
	            <div class="modal-header">
	                <h3>${title}</h3>
	                <span class="close-modal">&times;</span>
	            </div>
	            <div class="modal-body">
	                ${content}
	                <div class="btn-group" style="margin-top: 20px;">
	                    <button id="modalSaveBtn" class="btn btn-primary">保存</button>
	                    <button id="modalCloseBtn" class="btn close-modal">取消</button>
	                </div>
	            </div>
	        </div>
	    `;
	
	    modal.querySelector('.close-modal').addEventListener('click', () => {
	        document.body.removeChild(modal);
	    });
	    modal.querySelector('#modalCloseBtn').addEventListener('click', (e) => {
	        document.body.removeChild(modal);
	    });
	    modal.querySelector('#modalSaveBtn').addEventListener('click', () => {
	        onSave();
	        document.body.removeChild(modal);
	    });
	    return modal;
	},
	
	// 完善渲染函数（包含事件绑定）
	renderCottonCandyZonesUI: function() {
	    const container = document.getElementById('cottonCandyZonesContainer');
	    if (!container) return;
	    if (!this.mapData.cottonCandyZones) return;
	    let html = '';
	    this.mapData.cottonCandyZones.forEach((zone, idx) => {
	        html += `<div class="wave-item" data-index="${idx}">
	            <div class="wave-header">
	                <div class="wave-title">区域 ${idx+1}</div>
	                <div>
	                    <button class="btn edit-cotton-zone" style="padding:2px 5px;"><i class="fas fa-edit"></i></button>
	                    <button class="btn btn-danger delete-cotton-zone" style="padding:2px 5px;"><i class="fas fa-trash"></i></button>
	                </div>
	            </div>
	            <div class="task-item">
	                <div>行: ${zone.start_row} ~ ${zone.end_row}</div>
	                <div>列: ${zone.start_col} ~ ${zone.end_col}</div>
	            </div>
	        </div>`;
	    });
	    container.innerHTML = html || '<div class="form-control" style="text-align:center;">暂无棉花糖区域</div>';
	    
	    // 绑定编辑和删除事件
	    container.querySelectorAll('.edit-cotton-zone').forEach(btn => {
	        btn.addEventListener('click', (e) => {
	            const idx = parseInt(e.target.closest('.wave-item').dataset.index);
	            this.editCottonCandyZone(idx);
	        });
	    });
	    container.querySelectorAll('.delete-cotton-zone').forEach(btn => {
	        btn.addEventListener('click', (e) => {
	            const idx = parseInt(e.target.closest('.wave-item').dataset.index);
	            this.deleteCottonCandyZone(idx);
	        });
	    });
	},

	// 设置选中的单元格类型
	setSelectedCellType: function(type) {
		this.selectedCellType = type;
		const cellType = this.cellTypes[type];

		// 更新UI显示
		document.getElementById('selectedColorPreview').className = `color-preview ${cellType.className}`;
		document.getElementById('selectedTypeText').textContent = cellType.name;

		// 更新所有列表项的选中状态
		document.querySelectorAll('.list-item[data-type]').forEach(item => {
			if (parseInt(item.dataset.type) === type) {
				item.classList.add('selected');
			} else {
				item.classList.remove('selected');
			}
		});
	},

	// 渲染网格
	renderGrid: function() {
		const gridContainer = document.getElementById('gridContainer');
		const cols = this.mapData.gridCols;
		const rows = this.mapData.gridRows;
		const cellWidth = this.mapData.defCellWidth;
		const cellHeight = this.mapData.defCellHeight;

		// 设置网格列：第一列为推车列（宽度 40px），后面为普通列
		gridContainer.style.gridTemplateColumns = `[cart] 40px repeat(${cols}, ${cellWidth}px)`;
		gridContainer.style.gridTemplateRows = `repeat(${rows}, ${cellHeight}px)`;

		gridContainer.innerHTML = '';

		for (let row = 0; row < rows; row++) {
			// ---- 渲染推车单元格（列索引 -1）----
			const cartCell = document.createElement('div');
			cartCell.className = 'grid-cell cart-cell'; // 添加 cart-cell 类便于样式定制
			cartCell.dataset.row = row;
			cartCell.dataset.col = -1; // 特殊列标记

			// 根据 carts[row] 的值设置显示内容
			const cartType = this.mapData.carts[row] || 0;
			cartCell.innerHTML = this.getCartIcon(cartType); // 返回 emoji 或图标

			// 为推车单元格绑定点击事件（切换类型）
			cartCell.addEventListener('click', (e) => {
				e.stopPropagation();
				this.toggleCart(row);
			});

			gridContainer.appendChild(cartCell);

			// ---- 渲染普通单元格（列 0 到 cols-1）----
			for (let col = 0; col < cols; col++) {
				const cell = this.mapData.cells[row] && this.mapData.cells[row][col] ?
					this.mapData.cells[row][col] :
					{
						x: col,
						y: row,
						width: 1,
						height: 1,
						type: this.mapData.terrain,
						weather: 0,
						virtualZ: 0.0,
						prePlant: []
					};

				const cellType = this.cellTypes[cell.type];
				const cellElement = document.createElement('div');
				cellElement.className = 'grid-cell';
				cellElement.dataset.row = row;
				cellElement.dataset.col = col;
				cellElement.style.backgroundColor = cellType.color;

				// 单元格信息（行,列）
				const cellInfo = document.createElement('div');
				cellInfo.className = 'cell-info';
				cellInfo.textContent = `${row},${col}`;
				cellElement.appendChild(cellInfo);

				// 单元格类型图标
				const cellIcon = document.createElement('div');
				cellIcon.className = 'cell-type-icon';
				cellIcon.style.backgroundColor = cellType.color;
				cellIcon.style.filter = 'brightness(1.5)';
				cellElement.appendChild(cellIcon);

				if (cell.width > 1 || cell.height > 1) {
					cellElement.style.gridColumn = `span ${cell.width}`;
					cellElement.style.gridRow = `span ${cell.height}`;
				}

				cellElement.addEventListener('click', (e) => {
					this.selectCell(row, col);
				});

				gridContainer.appendChild(cellElement);
			}
		}

		this.updateMapTitle();
	},

	// 根据推车类型返回显示图标（这里使用 emoji）
	getCartIcon: function(type) {
	    switch(type) {
	        case 1: return '<span style="font-size:1.5rem;">🐱</span>';   // 猫（陆地推车）
	        case 2: return '<span style="font-size:1.5rem;">🦀</span>';   // 螃蟹（水面推车）
	        default: return '<span style="font-size:1.5rem; opacity:0.3;">⛔</span>'; // 无推车
	    }
	},
	
	// 切换指定行的推车类型 (0->1->2->0)
	toggleCart: function(row) {
		if(!this.mapData.carts[row]) this.mapData.carts[row] = 0;
	    let newType = (this.mapData.carts[row] + 1) % 3;
	    this.mapData.carts[row] = newType;
	    // 只重新渲染推车单元格，避免重绘整个网格（性能优化）
	    this.updateCartCell(row);
	},
	
	// 更新单行推车单元格的显示（避免全网格重绘）
	updateCartCell: function(row) {
	    // 使用 cart-cell 类名和 data-row 精确定位
	    const cartCell = document.querySelector(`.grid-cell.cart-cell[data-row="${row}"]`);
	    if (cartCell) {
	        cartCell.innerHTML = this.getCartIcon(this.mapData.carts[row]);
	    }
	},
	
	// 选择单元格
	selectCell: function(row, col) {
		// 清除之前选中的单元格
		document.querySelectorAll('.grid-cell.cell-selected').forEach(cell => {
			cell.classList.remove('cell-selected');
		});

		// 标记选中的单元格
		const cellElement = document.querySelector(`.grid-cell[data-row="${row}"][data-col="${col}"]`);
		if (cellElement) {
			cellElement.classList.add('cell-selected');
		}

		// 更新选中的单元格数据
		this.selectedCell = this.mapData.cells[row][col];

		// 更新UI
		this.updateCellPropertiesUI();
	},

	// 更新单元格属性UI
	updateCellPropertiesUI: function() {
		if (!this.selectedCell) return;

		const cell = this.selectedCell;

		// 更新位置显示
		document.getElementById('cellRow').textContent = cell.y;
		document.getElementById('cellCol').textContent = cell.x;

		// 更新单元格类型选择
		document.getElementById('cellType').value = cell.type;

		// 更新天气选择
		document.getElementById('cellWeather').value = cell.weather;

		// 更新虚拟高度
		document.getElementById('cellVirtualZ').value = cell.virtualZ;

		// 更新宽度和高度
		document.getElementById('cellWidth').value = cell.width;
		document.getElementById('cellHeight').value = cell.height;

		// 更新预放置配置
		this.updatePrePlaceUI();
	},

	// 更新预放置UI
	updatePrePlaceUI: function() {
		const container = document.getElementById('prePlaceContainer');
		const cell = this.selectedCell;

		if (!cell.prePlant || cell.prePlant.length === 0) {
			container.innerHTML = `
                    <div class="form-control" style="text-align: center; padding: 20px;">
                        未选择单元格或没有预放置配置
                    </div>
                `;
			return;
		}

		let html = '';
		cell.prePlant.forEach((prePlace, index) => {
			html += `
                    <div class="wave-item" data-index="${index}">
                        <div class="wave-header">
                            <div class="wave-title">预放置 ${index + 1}</div>
                            <div>
                                <button class="btn edit-preplace" style="padding: 2px 5px; font-size: 0.8rem;"><i class="fas fa-edit"></i></button>
                                <button class="btn btn-danger delete-preplace" style="padding: 2px 5px; font-size: 0.8rem;"><i class="fas fa-trash"></i></button>
                            </div>
                        </div>
                        <div class="task-item">
                            <div><strong>无卡牌ID:</strong> ${prePlace.noSuchCard || '无'}</div>
                            <div><strong>可选植物:</strong> ${prePlace.selectable ? prePlace.selectable.join(', ') : '无'}</div>
                        </div>
                    </div>
                `;
		});

		container.innerHTML = html;

		// 绑定预放置操作事件
		container.querySelectorAll('.edit-preplace').forEach(btn => {
			btn.addEventListener('click', (e) => {
				const index = parseInt(e.target.closest('.wave-item').dataset.index);
				this.editPrePlace(index);
			});
		});

		container.querySelectorAll('.delete-preplace').forEach(btn => {
			btn.addEventListener('click', (e) => {
				const index = parseInt(e.target.closest('.wave-item').dataset.index);
				this.deletePrePlace(index);
			});
		});
	},

	// 编辑预放置
	editPrePlace: function(index) {
		const prePlace = this.selectedCell.prePlant[index];
		const noSuchCard = prompt("请输入无卡牌ID (留空表示无):", prePlace.noSuchCard || '');
		if (noSuchCard === null) return; // 用户取消

		const selectableStr = prompt("请输入可选植物ID (用逗号分隔):",
			prePlace.selectable ? prePlace.selectable.join(', ') : '');
		if (selectableStr === null) return; // 用户取消

		this.selectedCell.prePlant[index] = {
			noSuchCard: noSuchCard.trim(),
			selectable: selectableStr.trim() ? selectableStr.split(',').map(s => s.trim()) : []
		};

		this.updatePrePlaceUI();
	},

	// 删除预放置
	deletePrePlace: function(index) {
		if (confirm("确定要删除这个预放置配置吗？")) {
			this.selectedCell.prePlant.splice(index, 1);
			this.updatePrePlaceUI();
		}
	},

	// 添加预放置
	addPrePlace: function() {
		if (!this.selectedCell.prePlant) {
			this.selectedCell.prePlant = [];
		}

		const noSuchCard = prompt("请输入无卡牌ID (留空表示无):", '');
		if (noSuchCard === null) return; // 用户取消

		const selectableStr = prompt("请输入可选植物ID (用逗号分隔):", '');
		if (selectableStr === null) return; // 用户取消

		this.selectedCell.prePlant.push({
			noSuchCard: noSuchCard.trim(),
			selectable: selectableStr.trim() ? selectableStr.split(',').map(s => s.trim()) : []
		});

		this.updatePrePlaceUI();
	},

	// 更新选中的单元格属性
	updateSelectedCellProperty: function(property, value) {
		if (!this.selectedCell) return;

		this.selectedCell[property] = value;

		// 重新渲染网格以反映更改
		this.renderGrid();

		// 重新选择单元格
		this.selectCell(this.selectedCell.y, this.selectedCell.x);
	},

	// 调整网格大小
	resizeGrid: function() {
		const newCols = parseInt(document.getElementById('gridCols').value);
		const newRows = parseInt(document.getElementById('gridRows').value);

		if (newCols < 1 || newRows < 1) {
			alert("列数和行数必须大于0");
			return;
		}
		
		// 调整 carts 数组长度
		const oldRows = this.mapData.gridRows;
		if (newRows > oldRows) {
			// 增加行，默认推车类型为 0
			for (let i = oldRows; i < newRows; i++) {
				this.mapData.carts.push(0);
			}
		} else if (newRows < oldRows) {
			// 减少行，截断数组
			this.mapData.carts.length = newRows;
		}

		// 创建新的单元格数组
		const newCells = [];
		for (let row = 0; row < newRows; row++) {
			newCells[row] = [];
			for (let col = 0; col < newCols; col++) {
				// 如果存在旧单元格，则复制它
				if (this.mapData.cells[row] && this.mapData.cells[row][col]) {
					newCells[row][col] = {
						...this.mapData.cells[row][col]
					};
				} else {
					// 否则创建新的默认单元格
					newCells[row][col] = {
						x: col,
						y: row,
						width: 1,
						height: 1,
						type: this.mapData.terrain,
						weather: 0,
						virtualZ: 0.0,
						prePlant: []
					};
				}
			}
		}

		// 更新地图数据
		this.mapData.gridCols = newCols;
		this.mapData.gridRows = newRows;
		this.mapData.cells = newCells;

		// 重新渲染网格
		this.renderGrid();
	},

	// 清空网格
	clearGrid: function() {
		for (let row = 0; row < this.mapData.gridRows; row++) {
			for (let col = 0; col < this.mapData.gridCols; col++) {
				this.mapData.cells[row][col] = {
					x: col,
					y: row,
					width: 1,
					height: 1,
					type: this.mapData.terrain,
					weather: 0,
					virtualZ: 0.0,
					prePlant: []
				};
			}
		}

		this.renderGrid();
		this.selectedCell = null;
		this.updateCellPropertiesUI();
	},

	// 填充网格
	fillGrid: function(type) {
		for (let row = 0; row < this.mapData.gridRows; row++) {
			for (let col = 0; col < this.mapData.gridCols; col++) {
				this.mapData.cells[row][col].type = type;
			}
		}

		this.renderGrid();
	},

	// 更新地图标题
	updateMapTitle: function() {
		const mapName = document.getElementById('mapName').value || this.mapData.mapName;
		const cols = document.getElementById('gridCols').value || this.mapData.gridCols;
		const rows = document.getElementById('gridRows').value || this.mapData.gridRows;

		document.getElementById('currentMapTitle').textContent =
			`${mapName} (${cols}x${rows})`;
	},

	// 切换标签页
	// switchTab: function(tabId) {
	// 	// 更新标签样式
	// 	document.querySelectorAll('.tab').forEach(tab => {
	// 		if (tab.dataset.tab === tabId) {
	// 			tab.classList.add('active');
	// 		} else {
	// 			tab.classList.remove('active');
	// 		}
	// 	});

	// 	// 显示对应的内容
	// 	document.querySelectorAll('.tab-pane').forEach(pane => {
	// 		if (pane.id === `${tabId}-tab`) {
	// 			pane.classList.add('active');
	// 		} else {
	// 			pane.classList.remove('active');
	// 		}
	// 	});
	// },

	switchTab: function(tabId) {
		// 只更新右侧面板的标签样式
		const rightPanel = document.querySelector('.right-panel');
		if (rightPanel) {
			rightPanel.querySelectorAll('.tab').forEach(tab => {
				if (tab.dataset.tab === tabId) {
					tab.classList.add('active');
				} else {
					tab.classList.remove('active');
				}
			});

			// 显示对应的内容
			rightPanel.querySelectorAll('.tab-pane').forEach(pane => {
				if (pane.id === `${tabId}-tab`) {
					pane.classList.add('active');
				} else {
					pane.classList.remove('active');
				}
			});
		}
	},

	// 添加波次
	addWave: function() {
		const newWave = {
			tasks: [{
				start_frame: 0,
				wait_previous: true,
				overlap_protection: true,
				progress: 0.0,
				is_big_wave: false,
				nextHint: false,
				resetToProgress: false,
				changeBGM: false,
				BGM: -1,
				isFinalHint: false,
				is_boss_wave: false,
				boss_type: "none",
				infiniteLoopWaveId: -1,
				infiniteLoopActive: false,
				infiniteLoopMonsters: [],
				bossCount: 0,
				bossDeathCount: 0,
				monsters: [{
					id: "zombie_normal",
					count: 5,
					interval: 100,
					row: -1,
					is_boss: false,
					avoid: []
				}],
				bossHealthBarConfig: {
					barMode: "single",
					healthBarLib: "",
					healthBarBackground: "",
					healthBarForeground: "",
					singleBoss: {
						bossId: "",
						bossName: "",
						avatarLib: "",
						avatarImage: "",
						positionX: 0,
						positionY: 0,
						width: 300,
						height: 30
					},
					baseX: 0,
					baseY: 0,
					baseWidth: 300,
					baseHeight: 30,
					doubleBosses: []
				}
			}]
		};

		this.mapData.waves.push(newWave);
		this.renderWavesUI();
	},

	// 渲染波次UI
	renderWavesUI: function() {
		const container = document.getElementById('wavesContainer');
		let html = '';

		this.mapData.waves.forEach((wave, waveIndex) => {
			html += `
                    <div class="wave-item" data-wave-index="${waveIndex}">
                        <div class="wave-header">
                            <div class="wave-title">波次 ${waveIndex + 1}</div>
                            <div>
                                <button class="btn edit-wave" style="padding: 2px 5px; font-size: 0.8rem;"><i class="fas fa-edit"></i></button>
                                <button class="btn btn-danger delete-wave" style="padding: 2px 5px; font-size: 0.8rem;"><i class="fas fa-trash"></i></button>
                            </div>
                        </div>
                `;

			wave.tasks.forEach((task, taskIndex) => {
				html += `
                        <div class="task-item">
                            <div>${task.is_big_wave ? '<i class="fas fa-flag"></i>' : ''} ${task.progress > 0 ? '<strong>'+task.progress*100+'%</strong>': ''} <strong> 任务 ${taskIndex + 1}</strong> (起始帧: ${task.start_frame}) </div>
                            ${task.is_boss_wave ? '<div><small>BOSS波次</small></div>' : ''}
                    `;

				task.monsters.forEach((monster, monsterIndex) => {
					html += `
                            <div class="monster-item">
                                <div class="monster-icon"></div>
                                <div>${monster.id} x ${monster.count} ${monster.is_boss ? '(BOSS)' : ''}</div>
                            </div>
                        `;
				});

				html += `</div>`;
			});

			html += `</div>`;
		});

		container.innerHTML = html;

		// 绑定波次操作事件
		container.querySelectorAll('.edit-wave').forEach(btn => {
			btn.addEventListener('click', (e) => {
				const waveIndex = parseInt(e.target.closest('.wave-item').dataset.waveIndex);
				this.editWave(waveIndex);
			});
		});

		container.querySelectorAll('.delete-wave').forEach(btn => {
			btn.addEventListener('click', (e) => {
				const waveIndex = parseInt(e.target.closest('.wave-item').dataset.waveIndex);
				this.deleteWave(waveIndex);
			});
		});
	},

	// 编辑波次 - 修改为支持多个任务
	editWave: function(waveIndex) {
		const wave = this.mapData.waves[waveIndex];

		// 创建任务选择和管理区域
		let tasksManagementHtml = `
	        <div id="tasks-management-tab" class="tab-pane active">
	            <div class="section-title">
	                <div>任务管理</div>
	                <button id="addTaskBtn" class="btn btn-primary" style="padding: 3px 8px; font-size: 0.8rem; width: 50%; margin: 8px">
	                    <i class="fas fa-plus"></i> 添加任务
	                </button>
	            </div>
	            <div id="tasksListContainer" style="margin-bottom: 20px;">
	    `;

		// 生成任务列表
		wave.tasks.forEach((task, taskIndex) => {
			const isActive = taskIndex === 0; // 默认第一个任务为激活状态
			tasksManagementHtml += `
	            <div class="wave-item task-list-item ${isActive ? 'active' : ''}" data-task-index="${taskIndex}">
	                <div class="wave-header">
	                    <div class="wave-title">
	                        <i class="fas fa-tasks"></i> 任务 ${taskIndex + 1}
	                        ${task.is_boss_wave ? ' <span class="badge badge-danger">BOSS</span>' : ''}
	                    </div>
	                    <div>
	                        <button class="btn btn-sm btn-primary switch-task" style="padding: 2px 5px; font-size: 0.8rem; width: 24px; height: 24px; margin: 8px" 
	                                title="切换到该任务">
	                            <i class="fas fa-edit"></i>
	                        </button>
	                        <button class="btn btn-sm btn-danger delete-task" style="padding: 2px 5px; font-size: 0.8rem; width: 24px; height: 24px" 
	                                ${wave.tasks.length <= 1 ? 'disabled' : ''} title="删除任务">
	                            <i class="fas fa-trash"></i>
	                        </button>
	                    </div>
	                </div>
	                <div class="task-item">
	                    <div><strong>起始帧:</strong> ${task.start_frame}</div>
	                    <div><strong>怪物数量:</strong> ${task.monsters ? task.monsters.length : 0}</div>
	                    <div><strong>是否大波:</strong> ${task.is_big_wave ? '是' : '否'}</div>
	                    ${task.is_boss_wave ? '<div><strong>BOSS类型:</strong> ' + task.boss_type + '</div>' : ''}
	                </div>
	            </div>
	        `;
		});

		tasksManagementHtml += `
	            </div>
	            <!--<div id="currentTaskContent">-->
	                <!-- 当前选中任务的编辑内容将在这里动态加载 -->
	            <!--</div>-->
	        </div>
	    `;

		// 基础设置标签页模板（用于动态加载）
		const generateBasicTabHtml = (task, taskIndex) => `
	        <div id="basic-tab-${taskIndex}" class="task-edit-tab" style="${taskIndex === 0 ? '' : 'display: none;'}">
	            <div class="form-group">
	                <label>起始帧</label>
	                <input type="number" id="startFrame-${taskIndex}" class="form-control" value="${task.start_frame || 0}">
	            </div>
	            <div class="form-group">
	                <label>
	                    <input type="checkbox" id="waitPrevious-${taskIndex}" ${task.wait_previous ? 'checked' : ''}>
	                    等待上一个波次
	                </label>
	            </div>
				<div class="form-group">
				    <label>最大等待帧数</label>
				    <input type="number" id="maxWaitFrames-${taskIndex}" class="form-control" value="${task.max_wait_previous_frames || 900}">
				</div>
	            <div class="form-group">
	                <label>
	                    <input type="checkbox" id="overlapProtection-${taskIndex}" ${task.overlap_protection ? 'checked' : ''}>
	                    重叠保护
	                </label>
	            </div>
	            <div class="form-group">
	                <label>进度位置</label>
	                <input type="number" id="progress-${taskIndex}" class="form-control" value="${task.progress || 0}" step="0.1" min="0" max="1">
	            </div>
	            <div class="form-group">
	                <label>
	                    <input type="checkbox" id="isBigWave-${taskIndex}" ${task.is_big_wave ? 'checked' : ''}>
	                    是否是大波次
	                </label>
	            </div>
	            <div class="form-group">
	                <label>
	                    <input type="checkbox" id="nextHint-${taskIndex}" ${task.nextHint ? 'checked' : ''}>
	                    下一个提示
	                </label>
	            </div>
	            <div class="form-group">
	                <label>
	                    <input type="checkbox" id="resetToProgress-${taskIndex}" ${task.resetToProgress ? 'checked' : ''}>
	                    重置到进度
	                </label>
	            </div>
	            <div class="form-group">
	                <label>
	                    <input type="checkbox" id="changeBGM-${taskIndex}" ${task.changeBGM ? 'checked' : ''}>
	                    改变BGM
	                </label>
	            </div>
	            <div class="form-group">
	                <label>BGM索引</label>
	                <input type="number" id="bgmIndex-${taskIndex}" class="form-control" value="${task.BGM || -1}">
	            </div>
	            <div class="form-group">
	                <label>
	                    <input type="checkbox" id="isFinalHint-${taskIndex}" ${task.isFinalHint ? 'checked' : ''}>
	                    最终提示
	                </label>
	            </div>
	        </div>
	    `;

		// 怪物配置标签页模板
		const generateMonstersTabHtml = (task, taskIndex) => {
			let monstersHtml = '';
			if (task.monsters) {
				task.monsters.forEach((monster, index) => {
					monstersHtml += `
	                    <div class="wave-item monster-item-editable" data-index="${index}" data-task="${taskIndex}">
	                        <div class="wave-header">
	                            <div class="wave-title">怪物 ${index + 1}</div>
	                            <div>
	                                <button class="btn delete-monster" style="padding: 2px 5px; font-size: 0.8rem;">
	                                    <i class="fas fa-trash"></i>
	                                </button>
	                            </div>
	                        </div>
	                        <div class="task-item">
	                            <div class="form-group">
	                                <label>怪物ID</label>
	                                <input type="text" class="form-control monster-id" value="${monster.id}">
	                            </div>
	                            <div class="form-group">
	                                <label>数量</label>
	                                <input type="number" class="form-control monster-count" value="${monster.count}">
	                            </div>
	                            <div class="form-group">
	                                <label>间隔</label>
	                                <input type="number" class="form-control monster-interval" value="${monster.interval || 100}">
	                            </div>
	                            <div class="form-group">
	                                <label>行 (-1表示随机)</label>
	                                <input type="number" class="form-control monster-row" value="${monster.row || -1}" min="-1" max="9">
	                            </div>
	                            <div class="form-group">
	                                <label>
	                                    <input type="checkbox" class="monster-isboss" ${monster.is_boss ? 'checked' : ''}>
	                                    是否为BOSS
	                                </label>
	                            </div>
	                            <div class="form-group">
	                                <label>避开行 (用逗号分隔，如: 0,2,4)</label>
	                                <input type="text" class="form-control monster-avoid" value="${monster.avoid ? monster.avoid.join(',') : ''}">
	                            </div>
	                        </div>
	                    </div>
	                `;
				});
			}

			return `
	            <div id="monsters-tab-${taskIndex}" class="task-edit-tab" style="${taskIndex === 0 ? '' : 'display: none;'}">
	                <button class="add-monster-btn btn btn-primary" data-task="${taskIndex}" style="margin-bottom: 10px;">
	                    <i class="fas fa-plus"></i> 添加怪物
	                </button>
	                <div class="monsters-container" data-task="${taskIndex}">
	                    ${monstersHtml || '<div>暂无怪物配置</div>'}
	                </div>
	            </div>
	        `;
		};

		// BOSS设置标签页模板
		const generateBossTabHtml = (task, taskIndex) => `
	        <div id="boss-tab-${taskIndex}" class="task-edit-tab" style="${taskIndex === 0 ? '' : 'display: none;'}">
	            <div class="form-group">
	                <label>
	                    <input type="checkbox" class="is-boss-wave" data-task="${taskIndex}" ${task.is_boss_wave ? 'checked' : ''}>
	                    是否为BOSS波次
	                </label>
	            </div>
	            <div class="form-group boss-type-group" data-task="${taskIndex}" style="${task.is_boss_wave ? '' : 'display: none;'}">
	                <label>BOSS类型</label>
	                <select class="boss-type form-control" data-task="${taskIndex}">
	                    <option value="none" ${task.boss_type === 'none' ? 'selected' : ''}>无</option>
	                    <option value="mid" ${task.boss_type === 'mid' ? 'selected' : ''}>中场</option>
	                    <option value="final" ${task.boss_type === 'final' ? 'selected' : ''}>最终</option>
	                </select>
	            </div>
	            <div class="form-group infinite-loop-group" data-task="${taskIndex}" style="${task.is_boss_wave ? '' : 'display: none;'}">
	                <label>无限循环波次ID (用于BOSS战期间刷小怪)</label>
	                <input type="number" class="infinite-loop-wave-id form-control" data-task="${taskIndex}" 
	                       value="${task.infiniteLoopWaveId || -1}" min="-1">
	            </div>
	            <div class="form-group boss-count-group" data-task="${taskIndex}" style="${task.is_boss_wave ? '' : 'display: none;'}">
	                <label>BOSS数量 (从怪物配置中标记为BOSS的怪物计算)</label>
	                <div class="form-control">
	                    <span class="boss-count-display" data-task="${taskIndex}">${this.calculateBossCount(task)}</span>
	                </div>
	            </div>
	        </div>
	    `;

		// 无限循环怪物标签页模板
		const generateInfiniteTabHtml = (task, taskIndex) => {
			let infiniteLoopHtml = '';
			if (task.infiniteLoopMonsters && task.infiniteLoopMonsters.length > 0) {
				task.infiniteLoopMonsters.forEach((monster, index) => {
					infiniteLoopHtml += `
	                    <div class="wave-item infinite-loop-item" data-index="${index}" data-task="${taskIndex}">
	                        <div class="wave-header">
	                            <div class="wave-title">无限循环怪物 ${index + 1}</div>
	                            <div>
	                                <button class="btn delete-infinite-monster" style="padding: 2px 5px; font-size: 0.8rem;">
	                                    <i class="fas fa-trash"></i>
	                                </button>
	                            </div>
	                        </div>
	                        <div class="task-item">
	                            <div class="form-group">
	                                <label>怪物ID</label>
	                                <input type="text" class="form-control infinite-monster-id" value="${monster.id}">
	                            </div>
	                            <div class="form-group">
	                                <label>数量 (-1表示无限)</label>
	                                <input type="number" class="form-control infinite-monster-count" 
	                                       value="${monster.count}" min="-1">
	                            </div>
	                            <div class="form-group">
	                                <label>间隔</label>
	                                <input type="number" class="form-control infinite-monster-interval" 
	                                       value="${monster.interval || 100}">
	                            </div>
	                            <div class="form-group">
	                                <label>行 (-1表示随机)</label>
	                                <input type="number" class="form-control infinite-monster-row" 
	                                       value="${monster.row || -1}" min="-1" max="9">
	                            </div>
	                            <div class="form-group">
	                                <label>避开行 (用逗号分隔，如: 0,2,4)</label>
	                                <input type="text" class="form-control infinite-monster-avoid" 
	                                       value="${monster.avoid ? monster.avoid.join(',') : ''}">
	                            </div>
	                        </div>
	                    </div>
	                `;
				});
			}

			return `
	            <div id="infinite-tab-${taskIndex}" class="task-edit-tab" style="${taskIndex === 0 ? '' : 'display: none;'}">
	                <button class="add-infinite-monster-btn btn btn-primary" data-task="${taskIndex}" style="margin-bottom: 10px;">
	                    <i class="fas fa-plus"></i> 添加无限循环怪物
	                </button>
	                <div class="infinite-monsters-container" data-task="${taskIndex}">
	                    ${infiniteLoopHtml || '<div>暂无无限循环怪物配置</div>'}
	                </div>
	            </div>
	        `;
		};

		// 血条配置标签页模板
		const generateHealthBarTabHtml = (task, taskIndex) => {
			if (!task) {
				return `
	                <div id="healthbar-tab-${taskIndex}" class="task-edit-tab" style="${taskIndex === 0 ? '' : 'display: none;'}">
	                    <div class="form-control" style="text-align: center; padding: 20px;">
	                        请先在基础设置中配置任务
	                    </div>
	                </div>
	            `;
			}

			const healthBar = task.bossHealthBarConfig || {};
			let healthBarHtml = `
	            <div id="healthbar-tab-${taskIndex}" class="task-edit-tab" style="${taskIndex === 0 ? '' : 'display: none;'}">
	                <div class="form-group">
	                    <label>血条模式</label>
	                    <select class="health-bar-mode form-control" data-task="${taskIndex}">
	                        <option value="single" ${healthBar.barMode === 'single' ? 'selected' : ''}>单BOSS</option>
	                        <option value="double" ${healthBar.barMode === 'double' ? 'selected' : ''}>双BOSS</option>
	                    </select>
	                </div>
	                <div class="form-group">
	                    <label>血条资源库GUID</label>
	                    <input type="text" class="health-bar-lib form-control" data-task="${taskIndex}" value="${healthBar.healthBarLib || ''}">
	                </div>
	                <div class="form-group">
	                    <label>血条背景GUID</label>
	                    <input type="text" class="health-bar-background form-control" data-task="${taskIndex}" value="${healthBar.healthBarBackground || ''}">
	                </div>
	                <div class="form-group">
	                    <label>血条前景GUID</label>
	                    <input type="text" class="health-bar-foreground form-control" data-task="${taskIndex}" value="${healthBar.healthBarForeground || ''}">
	                </div>
	        `;

			// 单BOSS配置
			healthBarHtml += `
	                <div class="single-boss-config" data-task="${taskIndex}" style="${healthBar.barMode === 'single' ? '' : 'display: none;'}">
	                    <div class="section-title">单BOSS配置</div>
	                    <div class="form-group">
	                        <label>BOSS ID</label>
	                        <input type="text" class="single-boss-id form-control" data-task="${taskIndex}" value="${healthBar.singleBoss?.bossId || ''}">
	                    </div>
	                    <div class="form-group">
	                        <label>BOSS名称</label>
	                        <input type="text" class="single-boss-name form-control" data-task="${taskIndex}" value="${healthBar.singleBoss?.bossName || ''}">
	                    </div>
	                    <div class="form-group">
	                        <label>头像资源库GUID</label>
	                        <input type="text" class="single-avatar-lib form-control" data-task="${taskIndex}" value="${healthBar.singleBoss?.avatarLib || ''}">
	                    </div>
	                    <div class="form-group">
	                        <label>头像图像GUID</label>
	                        <input type="text" class="single-avatar-image form-control" data-task="${taskIndex}" value="${healthBar.singleBoss?.avatarImage || ''}">
	                    </div>
	                    <div class="form-group">
	                        <label>位置X</label>
	                        <input type="number" class="single-pos-x form-control" data-task="${taskIndex}" value="${healthBar.singleBoss?.positionX || 0}" step="0.1">
	                    </div>
	                    <div class="form-group">
	                        <label>位置Y</label>
	                        <input type="number" class="single-pos-y form-control" data-task="${taskIndex}" value="${healthBar.singleBoss?.positionY || 0}" step="0.1">
	                    </div>
	                    <div class="form-group">
	                        <label>宽度</label>
	                        <input type="number" class="single-width form-control" data-task="${taskIndex}" value="${healthBar.singleBoss?.width || 300}" step="0.1">
	                    </div>
	                    <div class="form-group">
	                        <label>高度</label>
	                        <input type="number" class="single-height form-control" data-task="${taskIndex}" value="${healthBar.singleBoss?.height || 30}" step="0.1">
	                    </div>
	                </div>
	        `;

			// 双BOSS配置
			healthBarHtml += `
	                <div class="double-boss-config" data-task="${taskIndex}" style="${healthBar.barMode === 'double' ? '' : 'display: none;'}">
	                    <div class="section-title">双BOSS基础配置</div>
	                    <div class="form-group">
	                        <label>基础位置X</label>
	                        <input type="number" class="double-base-x form-control" data-task="${taskIndex}" value="${healthBar.baseX || 0}" step="0.1">
	                    </div>
	                    <div class="form-group">
	                        <label>基础位置Y</label>
	                        <input type="number" class="double-base-y form-control" data-task="${taskIndex}" value="${healthBar.baseY || 0}" step="0.1">
	                    </div>
	                    <div class="form-group">
	                        <label>基础宽度</label>
	                        <input type="number" class="double-base-width form-control" data-task="${taskIndex}" value="${healthBar.baseWidth || 300}" step="0.1">
	                    </div>
	                    <div class="form-group">
	                        <label>基础高度</label>
	                        <input type="number" class="double-base-height form-control" data-task="${taskIndex}" value="${healthBar.baseHeight || 30}" step="0.1">
	                    </div>
	                    
	                    <div class="section-title">双BOSS列表</div>
	                    <button class="add-double-boss-btn btn btn-primary" data-task="${taskIndex}" style="margin-bottom: 10px;">
	                        <i class="fas fa-plus"></i> 添加BOSS
	                    </button>
	                    <div class="double-bosses-container" data-task="${taskIndex}">
	        `;

			// 双BOSS列表
			if (healthBar.doubleBosses && healthBar.doubleBosses.length > 0) {
				healthBar.doubleBosses.forEach((boss, index) => {
					healthBarHtml += `
	                        <div class="wave-item double-boss-item" data-index="${index}" data-task="${taskIndex}">
	                            <div class="wave-header">
	                                <div class="wave-title">BOSS ${index + 1}</div>
	                                <div>
	                                    <button class="btn delete-double-boss" style="padding: 2px 5px; font-size: 0.8rem;">
	                                        <i class="fas fa-trash"></i>
	                                    </button>
	                                </div>
	                            </div>
	                            <div class="task-item">
	                                <div class="form-group">
	                                    <label>BOSS ID</label>
	                                    <input type="text" class="form-control double-boss-id" value="${boss.bossId || ''}">
	                                </div>
	                                <div class="form-group">
	                                    <label>BOSS名称</label>
	                                    <input type="text" class="form-control double-boss-name" value="${boss.bossName || ''}">
	                                </div>
	                                <div class="form-group">
	                                    <label>头像资源库GUID</label>
	                                    <input type="text" class="form-control double-avatar-lib" value="${boss.avatarLib || ''}">
	                                </div>
	                                <div class="form-group">
	                                    <label>头像图像GUID</label>
	                                    <input type="text" class="form-control double-avatar-image" value="${boss.avatarImage || ''}">
	                                </div>
	                                <div class="form-group">
	                                    <label>位置偏移Y</label>
	                                    <input type="number" class="form-control double-pos-y" 
	                                           value="${boss.positionY - (healthBar.baseY || 0) || index * 38}" step="0.1">
	                                </div>
	                            </div>
	                        </div>
	                `;
				});
			}

			healthBarHtml += `
	                    </div>
	                </div>
	            </div>
	        `;

			return healthBarHtml;
		};

		// 构建完整的编辑界面
		let html = '';

		// 为每个任务生成编辑标签页
		wave.tasks.forEach((task, taskIndex) => {
			html += generateBasicTabHtml(task, taskIndex);
			html += generateMonstersTabHtml(task, taskIndex);
			html += generateBossTabHtml(task, taskIndex);
			html += generateInfiniteTabHtml(task, taskIndex);
			html += generateHealthBarTabHtml(task, taskIndex);
		});

		// 更新模态框内容
		const modal = document.getElementById('waveEditModal');
		const content = document.getElementById('waveEditContent');
		content.innerHTML = html;

		const task_side = document.getElementById('taskSidebar');
		task_side.innerHTML = tasksManagementHtml;

		// 显示第一个任务的编辑内容
		this.loadTaskEditContent(0);

		// 显示模态框
		modal.style.display = 'flex';

		// 存储当前波次索引
		modal.dataset.waveIndex = waveIndex;
		modal.dataset.currentTaskIndex = 0;

		// 绑定事件
		this.bindWaveEditEvents(waveIndex, modal);
	},

	// 加载任务编辑内容
	loadTaskEditContent: function(taskIndex) {
		const modal = document.getElementById('waveEditModal');
		modal.dataset.currentTaskIndex = taskIndex;

		// 更新任务列表的激活状态
		document.querySelectorAll('.task-list-item').forEach(item => {
			const itemTaskIndex = parseInt(item.dataset.taskIndex);
			if (itemTaskIndex === taskIndex) {
				item.classList.add('active');
			} else {
				item.classList.remove('active');
			}
		});

		// 显示当前任务的编辑内容，隐藏其他任务的编辑内容
		document.querySelectorAll('.task-edit-tab').forEach(tab => {
			const tabId = tab.id;
			const tabTaskIndex = parseInt(tabId.split('-').pop());
			if (tabTaskIndex === taskIndex) {
				tab.style.display = 'block';
			} else {
				tab.style.display = 'none';
			}
		});

		// 更新标签页切换
		const tabContainer = modal.querySelector('.wave-edit-content .tab-container');
		if (tabContainer) {
			tabContainer.querySelectorAll('.tab').forEach(tab => {
				tab.classList.remove('active');
			});
			const firstTab = tabContainer.querySelector('.tab');
			if (firstTab) {
				firstTab.classList.add('active');
			}
		}


	},

	// 绑定波次编辑事件 - 补充完整
	bindWaveEditEvents: function(waveIndex, modal) {
		const wave = this.mapData.waves[waveIndex];

		// 绑定标签页切换
		modal.querySelector('.tab-container').addEventListener('click', (e) => {
			if (e.target.classList.contains('tab')) {
				const tabId = e.target.dataset.tab;

				// 只更新模态框内的标签样式
				modal.querySelectorAll('.tab').forEach(t => {
					if (t.dataset.tab === tabId) {
						t.classList.add('active');
					} else {
						t.classList.remove('active');
					}
				});

				// 显示对应的内容（只显示当前任务的相关内容）
				const currentTaskIndex = parseInt(modal.dataset.currentTaskIndex || 0);
				modal.querySelectorAll('.tab-pane, .task-edit-tab').forEach(pane => {
					if (pane.id === `${tabId}-tab`) {
						pane.style.display = 'block';
					} else if (pane.id && pane.id.startsWith(`${tabId}-tab-`)) {
						const paneTaskIndex = parseInt(pane.id.split('-').pop());
						pane.style.display = paneTaskIndex === currentTaskIndex ? 'block' :
							'none';
					} else if (pane.id && pane.id.includes('tab-')) {
						pane.style.display = 'none';
					}
				});

				e.stopPropagation();
			}
		});

		// 绑定添加任务按钮
		const addTaskBtn = modal.querySelector('#addTaskBtn');
		if (addTaskBtn) {
			addTaskBtn.addEventListener('click', () => {
				this.addNewTask(wave, modal);
			});
		}

		// 绑定切换任务按钮
		modal.querySelectorAll('.switch-task').forEach(btn => {
			btn.addEventListener('click', (e) => {
				const taskItem = e.target.closest('.task-list-item');
				const taskIndex = parseInt(taskItem.dataset.taskIndex);
				this.loadTaskEditContent(taskIndex);
			});
		});

		// 绑定删除任务按钮
		modal.querySelectorAll('.delete-task').forEach(btn => {
			btn.addEventListener('click', (e) => {
				const taskItem = e.target.closest('.task-list-item');
				const taskIndex = parseInt(taskItem.dataset.taskIndex);
				this.deleteTask(wave, taskIndex, modal);
			});
		});

		// 绑定添加怪物按钮
		modal.querySelectorAll('.add-monster-btn').forEach(btn => {
			btn.addEventListener('click', (e) => {
				const taskIndex = parseInt(e.target.dataset.task);
				this.addMonsterToTask(modal, taskIndex);
			});
		});

		// 绑定删除怪物按钮
		modal.querySelectorAll('.delete-monster').forEach(btn => {
			btn.addEventListener('click', function() {
				const monsterItem = this.closest('.monster-item-editable');
				if (monsterItem) monsterItem.remove();
			});
		});

		// 绑定添加无限循环怪物按钮
		modal.querySelectorAll('.add-infinite-monster-btn').forEach(btn => {
			btn.addEventListener('click', (e) => {
				const taskIndex = parseInt(e.target.dataset.task);
				this.addInfiniteMonsterToTask(modal, taskIndex);
			});
		});

		// 绑定删除无限循环怪物按钮
		modal.querySelectorAll('.delete-infinite-monster').forEach(btn => {
			btn.addEventListener('click', function() {
				const monsterItem = this.closest('.infinite-loop-item');
				if (monsterItem) monsterItem.remove();
			});
		});

		// 绑定添加双BOSS按钮
		modal.querySelectorAll('.add-double-boss-btn').forEach(btn => {
			btn.addEventListener('click', (e) => {
				const taskIndex = parseInt(e.target.dataset.task);
				this.addDoubleBossToTask(modal, taskIndex);
			});
		});

		// 绑定删除双BOSS按钮
		modal.querySelectorAll('.delete-double-boss').forEach(btn => {
			btn.addEventListener('click', function() {
				const bossItem = this.closest('.double-boss-item');
				if (bossItem) bossItem.remove();
			});
		});

		// 绑定BOSS波次复选框
		modal.querySelectorAll('.is-boss-wave').forEach(checkbox => {
			checkbox.addEventListener('change', function() {
				const taskIndex = parseInt(this.dataset.task);
				const bossTypeGroup = modal.querySelector(
					`.boss-type-group[data-task="${taskIndex}"]`);
				const infiniteLoopGroup = modal.querySelector(
					`.infinite-loop-group[data-task="${taskIndex}"]`);
				const bossCountGroup = modal.querySelector(
					`.boss-count-group[data-task="${taskIndex}"]`);

				if (bossTypeGroup) bossTypeGroup.style.display = this.checked ? 'block' :
				'none';
				if (infiniteLoopGroup) infiniteLoopGroup.style.display = this.checked ?
					'block' : 'none';
				if (bossCountGroup) bossCountGroup.style.display = this.checked ? 'block' :
					'none';
			});
		});

		// 绑定血条模式切换事件
		modal.querySelectorAll('.health-bar-mode').forEach(select => {
			select.addEventListener('change', function() {
				const taskIndex = parseInt(this.dataset.task);
				const singleConfig = modal.querySelector(
					`.single-boss-config[data-task="${taskIndex}"]`);
				const doubleConfig = modal.querySelector(
					`.double-boss-config[data-task="${taskIndex}"]`);

				if (this.value === 'single') {
					if (singleConfig) singleConfig.style.display = 'block';
					if (doubleConfig) doubleConfig.style.display = 'none';
				} else {
					if (singleConfig) singleConfig.style.display = 'none';
					if (doubleConfig) doubleConfig.style.display = 'block';
				}
			});
		});

		// 绑定保存按钮
		// const saveWaveBtn = modal.querySelector('#saveWaveBtn');
		// if (saveWaveBtn) {
		//     saveWaveBtn.addEventListener('click', () => {
		//         this.saveWaveConfig(waveIndex, modal);
		//     });
		// }

		// const saveWaveBtn = modal.querySelector('#saveWaveBtn');
		// if (saveWaveBtn) {
		//     const handler = () => this.saveWaveConfig(waveIndex, modal);
		//     saveWaveBtn.removeEventListener('click', handler);
		//     saveWaveBtn.addEventListener('click', handler);
		// }

		// 绑定取消按钮
		const cancelWaveBtn = modal.querySelector('#cancelWaveBtn');
		if (cancelWaveBtn) {
			cancelWaveBtn.addEventListener('click', () => {
				modal.style.display = 'none';
			});
		}

		// 绑定关闭按钮
		const closeBtn = modal.querySelector('.close-modal');
		if (closeBtn) {
			closeBtn.addEventListener('click', () => {
				modal.style.display = 'none';
			});
		}
	},

	// 添加怪物到任务
	addMonsterToTask: function(modal, taskIndex) {
		const monstersContainer = modal.querySelector(`.monsters-container[data-task="${taskIndex}"]`);
		const monsterIndex = monstersContainer.querySelectorAll('.monster-item-editable').length;

		const monsterHtml = `
	        <div class="wave-item monster-item-editable" data-index="${monsterIndex}" data-task="${taskIndex}">
	            <div class="wave-header">
	                <div class="wave-title">怪物 ${monsterIndex + 1}</div>
	                <div>
	                    <button class="btn delete-monster" style="padding: 2px 5px; font-size: 0.8rem;">
	                        <i class="fas fa-trash"></i>
	                    </button>
	                </div>
	            </div>
	            <div class="task-item">
	                <div class="form-group">
	                    <label>怪物ID</label>
	                    <input type="text" class="form-control monster-id" value="zombie_normal">
	                </div>
	                <div class="form-group">
	                    <label>数量</label>
	                    <input type="number" class="form-control monster-count" value="5">
	                </div>
	                <div class="form-group">
	                    <label>间隔</label>
	                    <input type="number" class="form-control monster-interval" value="100">
	                </div>
	                <div class="form-group">
	                    <label>行 (-1表示随机)</label>
	                    <input type="number" class="form-control monster-row" value="-1" min="-1" max="9">
	                </div>
	                <div class="form-group">
	                    <label>
	                        <input type="checkbox" class="monster-isboss">
	                        是否为BOSS
	                    </label>
	                </div>
	                <div class="form-group">
	                    <label>避开行 (用逗号分隔，如: 0,2,4)</label>
	                    <input type="text" class="form-control monster-avoid" value="">
	                </div>
	            </div>
	        </div>
	    `;

		monstersContainer.insertAdjacentHTML('beforeend', monsterHtml);

		// 绑定新删除按钮
		const newDeleteBtn = monstersContainer.lastElementChild.querySelector('.delete-monster');
		if (newDeleteBtn) {
			newDeleteBtn.addEventListener('click', function() {
				const monsterItem = this.closest('.monster-item-editable');
				if (monsterItem) monsterItem.remove();
			});
		}
	},

	// 添加无限循环怪物到任务
	addInfiniteMonsterToTask: function(modal, taskIndex) {
		const infiniteMonstersContainer = modal.querySelector(
			`.infinite-monsters-container[data-task="${taskIndex}"]`);
		const monsterIndex = infiniteMonstersContainer.querySelectorAll('.infinite-loop-item').length;

		const monsterHtml = `
	        <div class="wave-item infinite-loop-item" data-index="${monsterIndex}" data-task="${taskIndex}">
	            <div class="wave-header">
	                <div class="wave-title">无限循环怪物 ${monsterIndex + 1}</div>
	                <div>
	                    <button class="btn delete-infinite-monster" style="padding: 2px 5px; font-size: 0.8rem;">
	                        <i class="fas fa-trash"></i>
	                    </button>
	                </div>
	            </div>
	            <div class="task-item">
	                <div class="form-group">
	                    <label>怪物ID</label>
	                    <input type="text" class="form-control infinite-monster-id" value="zombie_normal">
	                </div>
	                <div class="form-group">
	                    <label>数量 (-1表示无限)</label>
	                    <input type="number" class="form-control infinite-monster-count" value="-1" min="-1">
	                </div>
	                <div class="form-group">
	                    <label>间隔</label>
	                    <input type="number" class="form-control infinite-monster-interval" value="100">
	                </div>
	                <div class="form-group">
	                    <label>行 (-1表示随机)</label>
	                    <input type="number" class="form-control infinite-monster-row" value="-1" min="-1" max="9">
	                </div>
	                <div class="form-group">
	                    <label>避开行 (用逗号分隔，如: 0,2,4)</label>
	                    <input type="text" class="form-control infinite-monster-avoid" value="">
	                </div>
	            </div>
	        </div>
	    `;

		infiniteMonstersContainer.insertAdjacentHTML('beforeend', monsterHtml);

		// 绑定新删除按钮
		const newDeleteBtn = infiniteMonstersContainer.lastElementChild.querySelector(
			'.delete-infinite-monster');
		if (newDeleteBtn) {
			newDeleteBtn.addEventListener('click', function() {
				const monsterItem = this.closest('.infinite-loop-item');
				if (monsterItem) monsterItem.remove();
			});
		}
	},

	// 添加双BOSS到任务
	addDoubleBossToTask: function(modal, taskIndex) {
		const doubleBossesContainer = modal.querySelector(`.double-bosses-container[data-task="${taskIndex}"]`);
		const bossIndex = doubleBossesContainer.querySelectorAll('.double-boss-item').length;

		const bossHtml = `
	        <div class="wave-item double-boss-item" data-index="${bossIndex}" data-task="${taskIndex}">
	            <div class="wave-header">
	                <div class="wave-title">BOSS ${bossIndex + 1}</div>
	                <div>
	                    <button class="btn delete-double-boss" style="padding: 2px 5px; font-size: 0.8rem;">
	                        <i class="fas fa-trash"></i>
	                    </button>
	                </div>
	            </div>
	            <div class="task-item">
	                <div class="form-group">
	                    <label>BOSS ID</label>
	                    <input type="text" class="form-control double-boss-id" value="">
	                </div>
	                <div class="form-group">
	                    <label>BOSS名称</label>
	                    <input type="text" class="form-control double-boss-name" value="">
	                </div>
	                <div class="form-group">
	                    <label>头像资源库GUID</label>
	                    <input type="text" class="form-control double-avatar-lib" value="">
	                </div>
	                <div class="form-group">
	                    <label>头像图像GUID</label>
	                    <input type="text" class="form-control double-avatar-image" value="">
	                </div>
	                <div class="form-group">
	                    <label>位置偏移Y</label>
	                    <input type="number" class="form-control double-pos-y" value="${bossIndex * 38}" step="0.1">
	                </div>
	            </div>
	        </div>
	    `;

		doubleBossesContainer.insertAdjacentHTML('beforeend', bossHtml);

		// 绑定新删除按钮
		const newDeleteBtn = doubleBossesContainer.lastElementChild.querySelector('.delete-double-boss');
		if (newDeleteBtn) {
			newDeleteBtn.addEventListener('click', function() {
				const bossItem = this.closest('.double-boss-item');
				if (bossItem) bossItem.remove();
			});
		}
	},

	// 添加新任务
	addNewTask: function(wave, modal) {
		const newTask = {
			start_frame: 0,
			wait_previous: true,
			overlap_protection: true,
			progress: 0.0,
			is_big_wave: false,
			nextHint: false,
			resetToProgress: false,
			changeBGM: false,
			BGM: -1,
			isFinalHint: false,
			is_boss_wave: false,
			boss_type: "none",
			infiniteLoopWaveId: -1,
			infiniteLoopActive: false,
			infiniteLoopMonsters: [],
			bossCount: 0,
			bossDeathCount: 0,
			monsters: [],
			bossHealthBarConfig: {
				barMode: "single",
				healthBarLib: "",
				healthBarBackground: "",
				healthBarForeground: "",
				singleBoss: {
					bossId: "",
					bossName: "",
					avatarLib: "",
					avatarImage: "",
					positionX: 0,
					positionY: 0,
					width: 300,
					height: 30
				},
				baseX: 0,
				baseY: 0,
				baseWidth: 300,
				baseHeight: 30,
				doubleBosses: []
			}
		};

		wave.tasks.push(newTask);
		const newTaskIndex = wave.tasks.length - 1;

		// 重新生成编辑界面
		this.editWave(parseInt(modal.dataset.waveIndex));

		// 切换到新任务
		setTimeout(() => {
			this.loadTaskEditContent(newTaskIndex);
		}, 100);
	},

	// 删除任务
	deleteTask: function(wave, taskIndex, modal) {
		if (wave.tasks.length <= 1) {
			alert("至少需要保留一个任务");
			return;
		}

		if (confirm("确定要删除这个任务吗？")) {
			wave.tasks.splice(taskIndex, 1);

			// 重新生成编辑界面
			this.editWave(parseInt(modal.dataset.waveIndex));

			// 切换到第一个任务
			setTimeout(() => {
				this.loadTaskEditContent(0);
			}, 100);
		}
	},

	// 计算BOSS数量
	calculateBossCount: function(task) {
		if (!task || !task.monsters) return 0;
		let count = 0;
		task.monsters.forEach(monster => {
			if (monster.is_boss) {
				count++;
			}
		});
		return count;
	},

	// 保存波次配置
	saveWaveConfig: function(waveIndex, modal) {
		const wave = this.mapData.waves[waveIndex];

		// 保存所有任务
		const tasks = modal.querySelectorAll('.task-list-item');
		tasks.forEach((taskItem, index) => {
			const taskIndex = parseInt(taskItem.dataset.taskIndex);
			if (wave.tasks[taskIndex]) {
				this.saveCurrentTaskConfig(wave, taskIndex, modal);
			}
		});

		// 重新渲染波次UI
		this.renderWavesUI();

		// 关闭模态框
		modal.style.display = 'none';
	},

	// 保存当前任务配置 - 补全
	saveCurrentTaskConfig: function(wave, taskIndex, modal) {
		const task = wave.tasks[taskIndex];

		// 更新基础设置
		if (modal.querySelector(`#startFrame-${taskIndex}`)) {
			task.start_frame = parseInt(modal.querySelector(`#startFrame-${taskIndex}`).value) || 0;
		}

		if (modal.querySelector(`#waitPrevious-${taskIndex}`)) {
			task.wait_previous = modal.querySelector(`#waitPrevious-${taskIndex}`).checked;
		}
		
		if (modal.querySelector(`#maxWaitFrames-${taskIndex}`)) {
		    task.max_wait_previous_frames = parseInt(modal.querySelector(`#maxWaitFrames-${taskIndex}`).value) || 900;
		}

		if (modal.querySelector(`#overlapProtection-${taskIndex}`)) {
			task.overlap_protection = modal.querySelector(`#overlapProtection-${taskIndex}`).checked;
		}

		if (modal.querySelector(`#progress-${taskIndex}`)) {
			task.progress = parseFloat(modal.querySelector(`#progress-${taskIndex}`).value) || 0;
		}

		if (modal.querySelector(`#isBigWave-${taskIndex}`)) {
			task.is_big_wave = modal.querySelector(`#isBigWave-${taskIndex}`).checked;
		}

		if (modal.querySelector(`#nextHint-${taskIndex}`)) {
			task.nextHint = modal.querySelector(`#nextHint-${taskIndex}`).checked;
		}

		if (modal.querySelector(`#resetToProgress-${taskIndex}`)) {
			task.resetToProgress = modal.querySelector(`#resetToProgress-${taskIndex}`).checked;
		}

		if (modal.querySelector(`#changeBGM-${taskIndex}`)) {
			task.changeBGM = modal.querySelector(`#changeBGM-${taskIndex}`).checked;
		}

		if (modal.querySelector(`#bgmIndex-${taskIndex}`)) {
			task.BGM = parseInt(modal.querySelector(`#bgmIndex-${taskIndex}`).value) || -1;
		}

		if (modal.querySelector(`#isFinalHint-${taskIndex}`)) {
			task.isFinalHint = modal.querySelector(`#isFinalHint-${taskIndex}`).checked;
		}

		// 更新BOSS设置
		if (modal.querySelector(`.is-boss-wave[data-task="${taskIndex}"]`)) {
			task.is_boss_wave = modal.querySelector(`.is-boss-wave[data-task="${taskIndex}"]`).checked;
		}

		if (task.is_boss_wave) {
			if (modal.querySelector(`.boss-type[data-task="${taskIndex}"]`)) {
				task.boss_type = modal.querySelector(`.boss-type[data-task="${taskIndex}"]`).value;
			}
			if (modal.querySelector(`.infinite-loop-wave-id[data-task="${taskIndex}"]`)) {
				task.infiniteLoopWaveId = parseInt(modal.querySelector(
					`.infinite-loop-wave-id[data-task="${taskIndex}"]`).value) || -1;
			}
		} else {
			task.boss_type = "none";
			task.infiniteLoopWaveId = -1;
		}

		// 更新怪物配置
		const monsterItems = modal.querySelectorAll(`.monster-item-editable[data-task="${taskIndex}"]`);
		task.monsters = [];

		monsterItems.forEach(item => {
			const monster = {
				id: item.querySelector('.monster-id')?.value || "zombie_normal",
				count: parseInt(item.querySelector('.monster-count')?.value) || 0,
				interval: parseInt(item.querySelector('.monster-interval')?.value) || 100,
				row: parseInt(item.querySelector('.monster-row')?.value) || -1,
				is_boss: item.querySelector('.monster-isboss')?.checked || false,
				avoid: []
			};

			// 解析避开行配置
			const avoidStr = item.querySelector('.monster-avoid')?.value || "";
			if (avoidStr.trim()) {
				monster.avoid = avoidStr.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
			}

			task.monsters.push(monster);
		});

		// 更新无限循环怪物配置
		const infiniteLoopItems = modal.querySelectorAll(`.infinite-loop-item[data-task="${taskIndex}"]`);
		task.infiniteLoopMonsters = [];
		infiniteLoopItems.forEach(item => {
			const monster = {
				id: item.querySelector('.infinite-monster-id')?.value || "",
				count: parseInt(item.querySelector('.infinite-monster-count')?.value) || -1,
				interval: parseInt(item.querySelector('.infinite-monster-interval')?.value) || 100,
				row: parseInt(item.querySelector('.infinite-monster-row')?.value) || -1,
				is_boss: false, // 无限循环怪物不是BOSS
				avoid: []
			};

			// 解析避开行配置
			const avoidStr = item.querySelector('.infinite-monster-avoid')?.value || "";
			if (avoidStr.trim()) {
				monster.avoid = avoidStr.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
			}

			task.infiniteLoopMonsters.push(monster);
		});

		// 更新血条配置
		if (modal.querySelector(`.health-bar-mode[data-task="${taskIndex}"]`)) {
			task.bossHealthBarConfig = task.bossHealthBarConfig || {};

			task.bossHealthBarConfig.barMode = modal.querySelector(`.health-bar-mode[data-task="${taskIndex}"]`)
				.value;
			task.bossHealthBarConfig.healthBarLib = modal.querySelector(
				`.health-bar-lib[data-task="${taskIndex}"]`)?.value || "";
			task.bossHealthBarConfig.healthBarBackground = modal.querySelector(
				`.health-bar-background[data-task="${taskIndex}"]`)?.value || "";
			task.bossHealthBarConfig.healthBarForeground = modal.querySelector(
				`.health-bar-foreground[data-task="${taskIndex}"]`)?.value || "";

			if (task.bossHealthBarConfig.barMode === 'single') {
				task.bossHealthBarConfig.singleBoss = {
					bossId: modal.querySelector(`.single-boss-id[data-task="${taskIndex}"]`)?.value || "",
					bossName: modal.querySelector(`.single-boss-name[data-task="${taskIndex}"]`)?.value ||
						"",
					avatarLib: modal.querySelector(`.single-avatar-lib[data-task="${taskIndex}"]`)?.value ||
						"",
					avatarImage: modal.querySelector(`.single-avatar-image[data-task="${taskIndex}"]`)
						?.value || "",
					positionX: parseFloat(modal.querySelector(`.single-pos-x[data-task="${taskIndex}"]`)
						?.value) || 0,
					positionY: parseFloat(modal.querySelector(`.single-pos-y[data-task="${taskIndex}"]`)
						?.value) || 0,
					width: parseFloat(modal.querySelector(`.single-width[data-task="${taskIndex}"]`)
						?.value) || 300,
					height: parseFloat(modal.querySelector(`.single-height[data-task="${taskIndex}"]`)
						?.value) || 30
				};
			} else if (task.bossHealthBarConfig.barMode === 'double') {
				task.bossHealthBarConfig.baseX = parseFloat(modal.querySelector(
					`.double-base-x[data-task="${taskIndex}"]`)?.value) || 0;
				task.bossHealthBarConfig.baseY = parseFloat(modal.querySelector(
					`.double-base-y[data-task="${taskIndex}"]`)?.value) || 0;
				task.bossHealthBarConfig.baseWidth = parseFloat(modal.querySelector(
					`.double-base-width[data-task="${taskIndex}"]`)?.value) || 300;
				task.bossHealthBarConfig.baseHeight = parseFloat(modal.querySelector(
					`.double-base-height[data-task="${taskIndex}"]`)?.value) || 30;

				const doubleBossItems = modal.querySelectorAll(`.double-boss-item[data-task="${taskIndex}"]`);
				task.bossHealthBarConfig.doubleBosses = [];

				doubleBossItems.forEach((item, index) => {
					const baseY = parseFloat(modal.querySelector(
						`.double-base-y[data-task="${taskIndex}"]`)?.value) || 0;
					const posYOffset = parseFloat(item.querySelector('.double-pos-y')?.value) || index *
						38;

					task.bossHealthBarConfig.doubleBosses.push({
						bossId: item.querySelector('.double-boss-id')?.value || "",
						bossName: item.querySelector('.double-boss-name')?.value || "",
						avatarLib: item.querySelector('.double-avatar-lib')?.value || "",
						avatarImage: item.querySelector('.double-avatar-image')?.value || "",
						positionX: task.bossHealthBarConfig.baseX,
						positionY: baseY + posYOffset,
						width: task.bossHealthBarConfig.baseWidth,
						height: task.bossHealthBarConfig.baseHeight
					});
				});
			}
		}

		// 更新BOSS数量显示
		if (modal.querySelector(`.boss-count-display[data-task="${taskIndex}"]`)) {
			const bossCount = this.calculateBossCount(task);
			modal.querySelector(`.boss-count-display[data-task="${taskIndex}"]`).textContent = bossCount;
		}

		// 计算并更新BOSS计数
		task.bossCount = this.calculateBossCount(task);
	},

	// 删除波次
	deleteWave: function(waveIndex) {
		if (confirm(`确定要删除波次 ${waveIndex + 1} 吗？`)) {
			this.mapData.waves.splice(waveIndex, 1);
			this.renderWavesUI();
		}
	},

	// 显示JSON模态框
	showJsonModal: function() {
		const jsonViewer = document.getElementById('jsonViewer');
		const jsonData = this.generateJsonData();

		// 格式化JSON
		const formattedJson = JSON.stringify(jsonData, null, 2);
		jsonViewer.textContent = formattedJson;

		// 显示模态框
		document.getElementById('jsonModal').style.display = 'flex';
	},

	// 生成JSON数据
	generateJsonData: function() {
		// 构建符合提供的JSON格式的数据
		const jsonData = {};

		const mapConfig = {
			MapName: this.mapData.mapName || this.mapData.mapId,
			DefBgm: this.mapData.defBgm,
			DefCellWidth: this.mapData.defCellWidth,
			DefCellHeight: this.mapData.defCellHeight,
			StartFrame: this.mapData.startFrame,
			Time: this.mapData.time
		};

		// 添加Desc对象（地图描述）
		mapConfig.Desc = {
			Text: this.mapData.desc.Text || "地图描述",
			DescLib: this.mapData.desc.DescLib || "{22B384DA-9F46-43C2-9BCB-27EE702B40CD}",
			DescImage: this.mapData.desc.DescImage || "{04F9EB89-888C-435E-965B-DC7BDFA63395}",
			DescMon: this.mapData.desc.DescMon || [],
			DescBoss: this.mapData.desc.DescBoss || "",
			DescBossLib: this.mapData.desc.DescBossLib || "",
			DescBossImage: this.mapData.desc.DescBossImage || ""
		};
		
		if (this.mapData.timeLimit.enabled) {
		  mapConfig.TimeLimit = {
		    Enabled: this.mapData.timeLimit.enabled,
		    Seconds: this.mapData.timeLimit.seconds
		  };
		}

		// 添加FogCol（如果非0）
		if (this.mapData.fogCols !== 0) {
			mapConfig.FogCol = this.mapData.fogCols;
		}

		// 添加Sunlight
		if (this.mapData.sunlight) {
			mapConfig.Sunlight = {
				BaseCount: this.mapData.sunlight.baseCount,
				MaxCount: this.mapData.sunlight.maxCount,
				Drop: this.mapData.sunlight.drop,
				Escape: this.mapData.sunlight.escape || 600, // 添加默认值
				Dealt: this.mapData.sunlight.dealt || 550, // 添加默认值
				Mode: this.mapData.sunlight.mode || 1 // 添加默认值
			};
			
			
		}
		
		// 棉花糖区域
		if (this.mapData.cottonCandyZones && this.mapData.cottonCandyZones.length > 0) {
		    mapConfig.CottonCandyZones = this.mapData.cottonCandyZones.map(zone => ({
		        start_row: zone.start_row,
		        end_row: zone.end_row,
		        start_col: zone.start_col,
		        end_col: zone.end_col
		    }));
		}
		
		// 平台组
		if (this.mapData.platformGroups && this.mapData.platformGroups.length > 0) {
		    mapConfig.PlatformGroups = this.mapData.platformGroups.map(group => {
		        const obj = {
		            start_frame: group.start_frame || 0,
		            loop: group.loop || false,
		            image_lib: group.image_lib || "",
		            image: group.image || "",
		            cells: group.cells || [],
		            steps: group.steps || []
		        };
		        return obj;
		    });
		}
		
		if (this.mapData.cottonCandyHoleGen) {
		    mapConfig.CottonCandyHoleGen = {
		        mode: this.mapData.cottonCandyHoleGen.mode,
		        interval: this.mapData.cottonCandyHoleGen.interval
		    };
		}

		// 添加Foreground
		if (this.mapData.foreground.lib || this.mapData.foreground.img) {
			mapConfig.Foreground = {
				X: this.mapData.foreground.x,
				Y: this.mapData.foreground.y,
				Lib: this.mapData.foreground.lib,
				Img: this.mapData.foreground.img,
				effect: false
			};
		}

		// 添加Background
		if (this.mapData.background.lib || this.mapData.background.img) {
			mapConfig.Background = {
				OffsetX: this.mapData.background.offsetX,
				OffsetY: this.mapData.background.offsetY,
				Lib: this.mapData.background.lib,
				Img: this.mapData.background.img
			};
		}

		// 添加Effects数组
		if (this.mapData.effects && this.mapData.effects.length > 0) {
			const effectsArray = [];
			this.mapData.effects.forEach(effect => {
				effectsArray.push({
					X: effect.X,
					Y: effect.Y,
					Lib: effect.Lib,
					Img: effect.Img || "", // 添加Img字段用于兼容Delphi代码中的bug
					Index: effect.Index,
					Count: effect.Count,
					Speed: effect.Speed
				});
			});
			mapConfig.Effects = effectsArray;
		}

		// 构建CellDef对象 - 修复：包含所有单元格
		const cellsArray = [];
		const defaultTerrain = this.mapData.terrain || 0;

		// 遍历所有单元格，确保每个单元格都包含在数组中
		for (let row = 0; row < this.mapData.gridRows; row++) {
			for (let col = 0; col < this.mapData.gridCols; col++) {
				const cell = this.mapData.cells[row] && this.mapData.cells[row][col] ?
					this.mapData.cells[row][col] : {
						x: col,
						y: row,
						width: 1,
						height: 1,
						type: defaultTerrain,
						weather: 0,
						virtualZ: 0.0,
						prePlant: []
					};

				const cellData = {
					X: col, // 列
					Y: row // 行
				};

				// 添加跨列跨行信息（如果大于1）
				if (cell.width > 1) {
					cellData.Col = cell.width;
				}
				if (cell.height > 1) {
					cellData.Row = cell.height;
				}

				// 添加地形类型（如果不同于默认地形或需要明确指定）
				const cellType = cell.type !== undefined ? cell.type : defaultTerrain;
				if (cellType !== defaultTerrain) {
					cellData.type = cellType;
				} else if (defaultTerrain !== 0) {
					// 如果默认地形不是普通(0)，则需要明确指定
					cellData.type = cellType;
				}

				// 添加天气效果（如果有）
				if (cell.weather && cell.weather !== 0) {
					cellData.weather = cell.weather;
				}

				// 添加虚拟高度（如果有）
				if (cell.virtualZ && cell.virtualZ !== 0.0) {
					cellData.Z = cell.virtualZ;
				}

				// 添加预放置配置（如果有）
				if (cell.prePlant && cell.prePlant.length > 0) {
					if (cell.prePlant.length === 1) {
						// 单个预放置配置
						cellData.PrePlace = {
							NoSuchCard: cell.prePlant[0].noSuchCard || "",
							Selectable: cell.prePlant[0].selectable || []
						};
					} else {
						// 多个预放置配置，使用数组
						cellData.PrePlace = cell.prePlant.map(pp => ({
							NoSuchCard: pp.noSuchCard || "",
							Selectable: pp.selectable || []
						}));
					}
				}

				cellsArray.push(cellData);
			}
		}

		// 添加CellDef - 修复：包含Left、Top和terrain字段
		mapConfig.CellDef = {
			Left: 305, // 默认值，对应Delphi代码
			Top: 110, // 默认值，对应Delphi代码
			Col: this.mapData.gridCols,
			Row: this.mapData.gridRows,
			DefExp: this.mapData.defExp,
			DefMapExpDelta: this.mapData.defExpDelta,
			WarnMsg: this.mapData.warnMsg||"",
			HoleCol: this.mapData.holeCol,
			HoleMon: this.mapData.holeMon,
			HoleGenBase: this.mapData.holeGenBase,
			HoleGenDelta: this.mapData.holeGenDelta,
			HoleSpawnBase: this.mapData.holeSpawnBase,
			HoleSpawnDelta: this.mapData.holeSpawnDelta,
			terrain: defaultTerrain, // 添加terrain字段
			Cells: cellsArray
		};
		
		mapConfig.Carts = this.mapData.carts;   // 新增

		// 添加Waves（如果有）
		if (this.mapData.waves && this.mapData.waves.length > 0) {
			mapConfig.Waves = this.convertWavesToJsonFormat(this.mapData.waves);
		}

		jsonData[this.mapData.mapId] = mapConfig;

		return jsonData;
	},

	// 新增函数：将波浪数据转换为JSON格式
	convertWavesToJsonFormat: function(waves) {
		const jsonWaves = [];

		waves.forEach(waveConfig => {
			const waveArray = [];

			if (waveConfig.tasks && Array.isArray(waveConfig.tasks)) {
				waveConfig.tasks.forEach(task => {
					const taskObj = {};

					// 添加任务属性
					if (task.start_frame !== undefined) taskObj.start_frame = task.start_frame;
					if (task.wait_previous !== undefined) taskObj.wait_previous = task
						.wait_previous;
					if (task.max_wait_previous_frames !== undefined && task.max_wait_previous_frames !== 900)
					    taskObj.max_wait_previous_frames = task.max_wait_previous_frames;
					
					if (task.overlap_protection !== undefined) taskObj.overlap_protection = task
						.overlap_protection;
					if (task.progress !== undefined) taskObj.progress = task.progress;
					if (task.is_big_wave !== undefined) taskObj.is_big_wave = task.is_big_wave;
					if (task.nextHint !== undefined) taskObj.nexthint = task.nextHint;
					if (task.isFinalHint !== undefined) taskObj.finalhint = task.isFinalHint;
					if (task.resetToProgress !== undefined) taskObj.resettoprogress = task
						.resetToProgress;
					if (task.changeBGM !== undefined) taskObj.changebgm = task.changeBGM;
					if (task.BGM !== undefined) taskObj.bgm = task.BGM;

					// BOSS波次相关
					if (task.is_boss_wave !== undefined) taskObj.is_boss_wave = task
						.is_boss_wave;
					if (task.boss_type !== undefined) taskObj.boss_type = task.boss_type;

					// 无限循环波次ID
					if (task.infiniteLoopWaveId !== undefined && task.infiniteLoopWaveId !== -
						1) {
						taskObj.infinite_loop_wave_id = task.infiniteLoopWaveId;
					}

					// 添加无限循环怪物
					if (task.infiniteLoopMonsters && task.infiniteLoopMonsters.length > 0) {
						taskObj.infinite_loop_monsters = task.infiniteLoopMonsters.map(
							monster => {
								const monsterObj = {
									id: monster.id,
									count: monster.count
								};
								if (monster.interval !== 100) monsterObj.interval = monster
									.interval;
								if (monster.row !== -1) monsterObj.row = monster.row;
								if (monster.avoid && monster.avoid.length > 0) monsterObj
									.avoid = monster.avoid;
								return monsterObj;
							});
					}

					// 添加BOSS血条配置
					if (task.bossHealthBarConfig && task.is_boss_wave) {
						const healthBar = task.bossHealthBarConfig;
						const bossHealthBarObj = {
							mode: healthBar.barMode,
							health_bar_lib: healthBar.healthBarLib || "",
							health_bar_background: healthBar.healthBarBackground || "",
							health_bar_foreground: healthBar.healthBarForeground || ""
						};

						if (healthBar.barMode === 'single' && healthBar.singleBoss) {
							bossHealthBarObj.single_boss = {
								name: healthBar.singleBoss.bossName || "",
								boss_id: healthBar.singleBoss.bossId || "",
								avatar_lib: healthBar.singleBoss.avatarLib || "",
								avatar_image: healthBar.singleBoss.avatarImage || "",
								x: healthBar.singleBoss.positionX || 0,
								y: healthBar.singleBoss.positionY || 0,
								width: healthBar.singleBoss.width || 300,
								height: healthBar.singleBoss.height || 30
							};
						} else if (healthBar.barMode === 'double') {
							bossHealthBarObj.x = healthBar.baseX || 0;
							bossHealthBarObj.y = healthBar.baseY || 0;
							bossHealthBarObj.width = healthBar.baseWidth || 300;
							bossHealthBarObj.height = healthBar.baseHeight || 30;

							if (healthBar.doubleBosses && healthBar.doubleBosses.length > 0) {
								bossHealthBarObj.double_bosses = healthBar.doubleBosses.map((
									boss, index) => ({
									name: boss.bossName || "",
									boss_id: boss.bossId || "",
									avatar_lib: boss.avatarLib || "",
									avatar_image: boss.avatarImage || ""
								}));
							}
						}

						taskObj.boss_health_bar = bossHealthBarObj;
					}

					// 添加怪物
					if (task.monsters && task.monsters.length > 0) {
						if (task.monsters.length === 1) {
							// 旧格式：单个怪物
							const monster = task.monsters[0];
							taskObj.id = monster.id;
							taskObj.count = monster.count;
							if (monster.interval !== 100) taskObj.interval = monster.interval;
							if (monster.row !== -1) taskObj.row = monster.row;
							if (monster.is_boss) taskObj.is_boss = monster.is_boss;
							if (monster.avoid && monster.avoid.length > 0) taskObj.avoid =
								monster.avoid;
						} else {
							// 新格式：monsters数组
							taskObj.monsters = task.monsters.map(monster => {
								const monsterObj = {
									id: monster.id,
									count: monster.count
								};
								if (monster.interval !== 100) monsterObj.interval =
									monster.interval;
								if (monster.row !== -1) monsterObj.row = monster.row;
								if (monster.is_boss) monsterObj.is_boss = monster
									.is_boss;
								if (monster.avoid && monster.avoid.length > 0)
									monsterObj.avoid = monster.avoid;
								return monsterObj;
							});
						}
					}

					waveArray.push(taskObj);
				});
			}

			jsonWaves.push(waveArray);
		});

		return jsonWaves;
	},

	// 复制JSON到剪贴板
	copyJsonToClipboard: function() {
		const jsonData = this.generateJsonData();
		const jsonString = JSON.stringify(jsonData, null, 2);

		navigator.clipboard.writeText(jsonString).then(() => {
			alert("JSON已复制到剪贴板");
		}).catch(err => {
			console.error('复制失败: ', err);
			alert("复制失败，请手动复制JSON内容");
		});
	},

	// 从文本加载JSON
	loadJsonFromText: function() {
	    const jsonText = prompt("请输入JSON数据:");
	    if (!jsonText) return;
	
	    try {
	        const jsonData = JSON.parse(jsonText);
	        // 没有文件名，传 null 使用默认或内置 MapId
	        this.loadMapData(jsonData, null);
	        alert("地图数据加载成功");
	    } catch (error) {
	        alert("JSON格式错误: " + error.message);
	    }
	},

	// 生成Lua数据
	generateLuaData: function() {
		const jsonData = this.generateJsonData();
		// 获取地图ID对应的配置数据
		const mapId = Object.keys(jsonData)[0];
		const mapConfig = jsonData[mapId];

		// 直接返回地图配置，不包含最外层的地图ID
		return 'local map = ' + this.convertJsonToLua(mapConfig, 0) + '\nreturn map';
	},

	// 将JSON转换为Lua Table格式
	convertJsonToLua: function(jsonData, indent = 0) {
		const indentStr = '    '.repeat(indent);
		const nextIndent = indent + 1;
		const nextIndentStr = '    '.repeat(nextIndent);

		// 如果是数组
		if (Array.isArray(jsonData)) {
			if (jsonData.length === 0) {
				return '{}';
			}

			let lua = '{\n';
			jsonData.forEach((item, index) => {
				const isLast = index === jsonData.length - 1;
				lua += nextIndentStr;
				lua += this.convertJsonToLuaItem(item, nextIndent);
				lua += isLast ? '\n' : ',\n';
			});
			lua += indentStr + '}';
			return lua;
		}
		// 如果是对象
		else if (typeof jsonData === 'object' && jsonData !== null) {
			const keys = Object.keys(jsonData);

			if (keys.length === 0) {
				return '{}';
			}

			let lua = '{\n';
			keys.forEach((key, index) => {
				const value = jsonData[key];
				const isLast = index === keys.length - 1;

				// 处理键名
				let keyStr;
				if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(key)) {
					keyStr = key;
				} else {
					keyStr = `["${key}"]`;
				}

				// 处理值
				let valueStr;
				if (value === null) {
					valueStr = 'nil';
				} else if (typeof value === 'boolean') {
					valueStr = value ? 'true' : 'false';
				} else if (typeof value === 'number') {
					valueStr = value.toString();
				} else if (typeof value === 'string') {
					// 转义字符串中的特殊字符
					const escaped = value.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g,
						'\\n');
					valueStr = `"${escaped}"`;
				} else if (Array.isArray(value) || typeof value === 'object') {
					valueStr = this.convertJsonToLua(value, nextIndent);
				} else {
					valueStr = 'nil';
				}

				lua += nextIndentStr + keyStr + ' = ' + valueStr;
				if (!isLast) {
					lua += ',\n';
				}
			});

			lua += '\n' + indentStr + '}';
			return lua;
		}
		// 其他类型
		else {
			return this.convertJsonToLuaItem(jsonData, indent);
		}
	},

	// 处理Lua Table中的单个项
	convertJsonToLuaItem: function(item, indent = 0) {
		const indentStr = '    '.repeat(indent);

		if (item === null) {
			return 'nil';
		} else if (typeof item === 'boolean') {
			return item ? 'true' : 'false';
		} else if (typeof item === 'number') {
			return item.toString();
		} else if (typeof item === 'string') {
			const escaped = item.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
			return `"${escaped}"`;
		} else if (Array.isArray(item)) {
			if (item.length === 0) {
				return '{}';
			}

			let result = '{\n';
			const nextIndent = indent + 1;
			const nextIndentStr = '    '.repeat(nextIndent);

			item.forEach((subItem, index) => {
				const isLast = index === item.length - 1;
				result += nextIndentStr;
				result += this.convertJsonToLuaItem(subItem, nextIndent);
				result += isLast ? '\n' : ',\n';
			});

			result += indentStr + '    }';
			return result;
		} else if (typeof item === 'object') {
			return this.convertJsonToLua(item, indent);
		}

		return 'nil';
	},
	// generateLuaData: function() {
	// 	const jsonData = this.generateJsonData();
	// 	return 'local map = ' + this.convertJsonToLua(jsonData) + '\nreturn map';
	// },

	// // 将JSON转换为Lua Table格式
	// convertJsonToLua: function(jsonData, indent = 0) {
	// 	const indentStr = '    '.repeat(indent);
	// 	const nextIndent = indent + 1;
	// 	const nextIndentStr = '    '.repeat(nextIndent);

	// 	let lua = '{\n';
	// 	const keys = Object.keys(jsonData);

	// 	keys.forEach((key, index) => {
	// 		const value = jsonData[key];
	// 		const isLast = index === keys.length - 1;

	// 		// 处理键名
	// 		let keyStr;
	// 		if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(key)) {
	// 			keyStr = key;
	// 		} else {
	// 			keyStr = `["${key}"]`;
	// 		}

	// 		// 处理值
	// 		let valueStr;
	// 		if (value === null) {
	// 			valueStr = 'nil';
	// 		} else if (typeof value === 'boolean') {
	// 			valueStr = value ? 'true' : 'false';
	// 		} else if (typeof value === 'number') {
	// 			valueStr = value.toString();
	// 		} else if (typeof value === 'string') {
	// 			// 转义字符串中的特殊字符
	// 			const escaped = value.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
	// 			valueStr = `"${escaped}"`;
	// 		} else if (Array.isArray(value)) {
	// 			if (value.length === 0) {
	// 				valueStr = '{}';
	// 			} else {
	// 				valueStr = '{\n';
	// 				value.forEach((item, itemIndex) => {
	// 					const isItemLast = itemIndex === value.length - 1;
	// 					valueStr += nextIndentStr;
	// 					valueStr += this.convertJsonToLuaItem(item, nextIndent);
	// 					valueStr += isItemLast ? '\n' : ',\n';
	// 				});
	// 				valueStr += indentStr + '    }';
	// 			}
	// 		} else if (typeof value === 'object') {
	// 			valueStr = this.convertJsonToLua(value, nextIndent);
	// 		}

	// 		lua += nextIndentStr + keyStr + ' = ' + valueStr;
	// 		if (!isLast) {
	// 			lua += ',\n';
	// 		}
	// 	});

	// 	lua += '\n' + indentStr + '}';
	// 	return lua;
	// },

	// // 处理Lua Table中的单个项
	// convertJsonToLuaItem: function(item, indent = 0) {
	// 	const indentStr = '    '.repeat(indent);

	// 	if (item === null) {
	// 		return 'nil';
	// 	} else if (typeof item === 'boolean') {
	// 		return item ? 'true' : 'false';
	// 	} else if (typeof item === 'number') {
	// 		return item.toString();
	// 	} else if (typeof item === 'string') {
	// 		const escaped = item.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
	// 		return `"${escaped}"`;
	// 	} else if (Array.isArray(item)) {
	// 		if (item.length === 0) {
	// 			return '{}';
	// 		}

	// 		let result = '{\n';
	// 		const nextIndent = indent + 1;
	// 		const nextIndentStr = '    '.repeat(nextIndent);

	// 		item.forEach((subItem, index) => {
	// 			const isLast = index === item.length - 1;
	// 			result += nextIndentStr;
	// 			result += this.convertJsonToLuaItem(subItem, nextIndent);
	// 			result += isLast ? '\n' : ',\n';
	// 		});

	// 		result += indentStr + '    }';
	// 		return result;
	// 	} else if (typeof item === 'object') {
	// 		return this.convertJsonToLua(item, indent);
	// 	}

	// 	return 'nil';
	// },

	// 显示Lua Table模态框
	showLuaModal: function() {
		const luaViewer = document.getElementById('luaViewer');
		const luaData = this.generateLuaData();

		// 格式化显示（添加语法高亮）- 确保使用innerHTML
		luaViewer.innerHTML = this.formatLuaForDisplay(luaData);

		// 显示模态框
		document.getElementById('luaModal').style.display = 'flex';
	},

	// 格式化Lua代码用于显示
	formatLuaForDisplay: function(luaCode) {
		// 先转义HTML特殊字符
		let html = luaCode
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;');

		// 现在添加语法高亮标签（不需要再转义引号，因为上面已经转义了）
		// 关键字高亮
		const keywords = [
			'local', 'function', 'end', 'if', 'then', 'else', 'elseif',
			'for', 'do', 'while', 'repeat', 'until', 'return', 'break',
			'true', 'false', 'nil', 'and', 'or', 'not', 'in'
		];

		// 字符串高亮 - 匹配Lua中的双引号和单引号字符串
		html = html.replace(/"([^"\\]*(\\.[^"\\]*)*)"/g, match => `<span class="lua-string">${match}</span>`);
		html = html.replace(/'([^'\\]*(\\.[^'\\]*)*)'/g, match => `<span class="lua-string">${match}</span>`);

		// 数字高亮
		html = html.replace(/\b\d+(\.\d+)?\b/g, match => `<span class="lua-number">${match}</span>`);

		// 注释高亮
		html = html.replace(/--[^\n]*/g, match => `<span class="lua-comment">${match}</span>`);

		keywords.forEach(keyword => {
			const regex = new RegExp(`\\b${keyword}\\b`, 'g');
			html = html.replace(regex, `<span class="lua-keyword">${keyword}</span>`);
		});

		return html;
	},

	// 新增函数：将波浪数据转换为JSON格式
	convertWavesToJsonFormat: function(waves) {
		const jsonWaves = [];

		waves.forEach(waveConfig => {
			const waveArray = [];

			if (waveConfig.tasks && Array.isArray(waveConfig.tasks)) {
				waveConfig.tasks.forEach(task => {
					const taskObj = {};

					// 添加任务属性
					if (task.start_frame !== undefined) taskObj.start_frame = task.start_frame;
					if (task.wait_previous !== undefined) taskObj.wait_previous = task
						.wait_previous;
					if (task.overlap_protection !== undefined) taskObj.overlap_protection = task
						.overlap_protection;
					if (task.progress !== undefined) taskObj.progress = task.progress;
					if (task.is_big_wave !== undefined) taskObj.is_big_wave = task.is_big_wave;
					if (task.nextHint !== undefined) taskObj.nexthint = task.nextHint;
					if (task.isFinalHint !== undefined) taskObj.finalhint = task.isFinalHint;
					if (task.resetToProgress !== undefined) taskObj.resettoprogress = task
						.resetToProgress;
					if (task.changeBGM !== undefined) taskObj.changebgm = task.changeBGM;
					if (task.BGM !== undefined) taskObj.bgm = task.BGM;

					// BOSS波次相关 - 确保所有BOSS相关字段都导出
					if (task.is_boss_wave !== undefined) {
						taskObj.is_boss_wave = task.is_boss_wave;

						// 只有当是BOSS波次时才导出BOSS相关字段
						if (task.is_boss_wave) {
							if (task.boss_type !== undefined) taskObj.boss_type = task
							.boss_type;

							// 无限循环波次ID（如果设置了）
							if (task.infiniteLoopWaveId !== undefined && task
								.infiniteLoopWaveId !== -1) {
								taskObj.infinite_loop_wave_id = task.infiniteLoopWaveId;
							}
						}
					}

					// 添加无限循环怪物
					if (task.infiniteLoopMonsters && task.infiniteLoopMonsters.length > 0) {
						taskObj.infinite_loop_monsters = task.infiniteLoopMonsters.map(
							monster => {
								const monsterObj = {
									id: monster.id,
									count: monster.count
								};
								if (monster.interval !== 100) monsterObj.interval = monster
									.interval;
								if (monster.row !== -1) monsterObj.row = monster.row;
								if (monster.avoid && monster.avoid.length > 0) monsterObj
									.avoid = monster.avoid;
								return monsterObj;
							});
					}

					// 添加BOSS血条配置（只有BOSS波次才需要）
					if (task.bossHealthBarConfig && task.is_boss_wave) {
						const healthBar = task.bossHealthBarConfig;
						const bossHealthBarObj = {
							mode: healthBar.barMode,
							health_bar_lib: healthBar.healthBarLib || "",
							health_bar_background: healthBar.healthBarBackground || "",
							health_bar_foreground: healthBar.healthBarForeground || ""
						};

						if (healthBar.barMode === 'single' && healthBar.singleBoss) {
							bossHealthBarObj.single_boss = {
								name: healthBar.singleBoss.bossName || "",
								boss_id: healthBar.singleBoss.bossId || "",
								avatar_lib: healthBar.singleBoss.avatarLib || "",
								avatar_image: healthBar.singleBoss.avatarImage || "",
								x: healthBar.singleBoss.positionX || 0,
								y: healthBar.singleBoss.positionY || 0,
								width: healthBar.singleBoss.width || 300,
								height: healthBar.singleBoss.height || 30
							};
						} else if (healthBar.barMode === 'double') {
							// 确保导出双BOSS模式的所有必要字段
							bossHealthBarObj.x = healthBar.baseX || 0;
							bossHealthBarObj.y = healthBar.baseY || 0;
							bossHealthBarObj.width = healthBar.baseWidth || 300;
							bossHealthBarObj.height = healthBar.baseHeight || 30;

							if (healthBar.doubleBosses && healthBar.doubleBosses.length > 0) {
								bossHealthBarObj.double_bosses = healthBar.doubleBosses.map((
									boss, index) => ({
									name: boss.bossName || "",
									boss_id: boss.bossId || "",
									avatar_lib: boss.avatarLib || "",
									avatar_image: boss.avatarImage || ""
								}));
							}
						}

						taskObj.boss_health_bar = bossHealthBarObj;
					}

					// 添加怪物 - 确保怪物数组正确导出
					if (task.monsters && task.monsters.length > 0) {
						// 总是使用monsters数组格式（新格式）
						taskObj.monsters = task.monsters.map(monster => {
							const monsterObj = {
								id: monster.id,
								count: monster.count
							};
							if (monster.interval !== 100) monsterObj.interval = monster
								.interval;
							if (monster.row !== -1) monsterObj.row = monster.row;
							if (monster.is_boss) monsterObj.is_boss = monster.is_boss;
							if (monster.avoid && monster.avoid.length > 0) monsterObj
								.avoid = monster.avoid;
							return monsterObj;
						});
					}

					waveArray.push(taskObj);
				});
			}

			jsonWaves.push(waveArray);
		});

		return jsonWaves;
	},

	// 复制Lua代码到剪贴板
	copyLuaToClipboard: function() {
		const luaData = this.generateLuaData();

		navigator.clipboard.writeText(luaData).then(() => {
			alert("Lua Table已复制到剪贴板");
		}).catch(err => {
			console.error('复制失败: ', err);
			alert("复制失败，请手动复制Lua代码");
		});
	},

	// 下载Lua文件
	downloadLuaFile: function() {
		const luaData = this.generateLuaData();
		const mapId = this.mapData.mapId;

		// 创建下载链接
		const blob = new Blob([luaData], {
			type: 'text/plain'
		});
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `${mapId}.lua`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);

		alert(`Lua Table已保存为 ${mapId}.lua`);
	},

	// 导入JSON
	importJson: function() {
	    // 提示用户当前未保存的更改会丢失
	    if (!confirm("导入新地图将丢失当前未保存的更改，确定继续吗？")) {
	        return;
	    }
	
	    // 动态创建文件输入元素
	    const fileInput = document.createElement('input');
	    fileInput.type = 'file';
	    fileInput.accept = '.json,application/json';
	
	    fileInput.addEventListener('change', (event) => {
	        const file = event.target.files[0];
	        if (!file) return;
	
	        // 获取文件名（去除 .json 扩展名）
	        const fileName = file.name.replace(/\.json$/i, '');
	
	        const reader = new FileReader();
	        reader.onload = (e) => {
	            try {
	                const jsonData = JSON.parse(e.target.result);
	                // 传入文件名参数
	                this.loadMapData(jsonData, fileName);
	            } catch (error) {
	                console.error('JSON解析失败:', error);
	                alert('文件格式错误，请选择有效的 JSON 文件。\n' + error.message);
	            }
	        };
	        reader.readAsText(file);
	
	        // 读取完成后清理文件输入，允许再次选择同一文件
	        fileInput.value = '';
	    });
	
	    // 触发文件选择对话框
	    fileInput.click();
	},
	
	// 加载地图
	loadMap: function() {
		alert("加载地图文件功能开发中，请使用'导入JSON'功能加载地图数据");
	},

	// 加载地图数据
	loadMapData: function(jsonData, fileName) {
	    try {
	        let mapId, mapConfig;
	
	        // 智能识别 JSON 格式
	        const keys = Object.keys(jsonData);
	        if (keys.length === 1 && typeof jsonData[keys[0]] === 'object' && jsonData[keys[0]] !== null) {
	            // 格式1: { "level_01": { ... } }
	            mapId = keys[0];
	            mapConfig = jsonData[mapId];
	        } else if (jsonData.MapName !== undefined || jsonData.CellDef !== undefined) {
	            // 格式2: { "MapName": "...", "CellDef": {...}, ... }
	            // 优先使用 JSON 内的 MapId 字段，否则使用文件名，再否则默认
	            mapId = jsonData.MapId || fileName || "imported_map";
	            mapConfig = jsonData;
	        } else {
	            alert("JSON 格式错误：无法识别的地图数据结构");
	            return;
	        }
	
	        if (!mapConfig || typeof mapConfig !== 'object') {
	            alert("JSON 格式错误：地图配置无效");
	            return;
	        }

			console.log("正在加载地图:", mapId);
			console.log("地图配置:", mapConfig);

			// 问题：多次导入时，旧数据是否会残留？
			// 解决方案：在加载新地图前，先重置mapData

			// 保存当前选中的单元格类型和选中的单元格（UI状态）
			const currentSelectedCellType = this.selectedCellType;
			const currentSelectedCell = this.selectedCell;

			// 完全重置mapData到一个新的对象
			this.mapData = {
				mapId: mapId,
				mapName: mapConfig.MapName || mapId,
				defCellWidth: mapConfig.DefCellWidth || 80,
				defCellHeight: mapConfig.DefCellHeight || 80,
				time: mapConfig.Time !== undefined ? mapConfig.Time : 12,
				fogCols: mapConfig.FogCol || 0,
				startFrame: mapConfig.StartFrame || 0,
				defBgm: mapConfig.DefBgm || 1,
				terrain: mapConfig.terrain || 0, // 从CellDef.terrain获取，如果没有则默认为0
				gridCols: 9, // 临时值，后面会从CellDef更新
				gridRows: 5, // 临时值，后面会从CellDef更新
				defExp: 5000,
				defExpDelta: 5000,
				warnMsg: "",
				holeCol: 0,
				holeMon: [],
				holeGenBase: 0,
				holeGenDelta: 0,
				holeSpawnBase: 0,
				holeSpawnDelta: 0,
				background: {
					lib: "",
					img: "",
					offsetX: 0,
					offsetY: 0
				},
				foreground: {
					lib: "",
					img: "",
					x: 0,
					y: 0
				},
				sunlight: {
					drop: true,
					baseCount: 25,
					maxCount: 9999,
					escape: 600,
					dealt: 550,
					mode: 1
				},
				desc: {
					Text: "地图名\\天气\\模式\\攻击波数",
					DescLib: "",
					DescImage: "",
					DescMon: [],
					DescBoss: "",
					DescBossLib: "",
					DescBossImage: ""
				},
				cells: [],
				waves: [],
				effects: [],
				platformGroups: [],        // 移动平台组
				cottonCandyZones: [],      // 棉花糖区域
				cottonCandyHoleGen: {
				    mode: "timed",   // "columnRandom" 或 "timed"
				    interval: 30.0
				},
				timeLimit: {
				    enabled: false,
				    seconds: 60
				}
			};

			// 恢复UI状态
			this.selectedCellType = currentSelectedCellType;
			this.selectedCell = currentSelectedCell;

			// 解析Desc对象
			if (mapConfig.Desc) {
				this.mapData.desc.Text = mapConfig.Desc.Text || "曲奇岛\\白天关卡\\通关模式\\攻击波数:4波";
				this.mapData.desc.DescLib = mapConfig.Desc.DescLib || "{22B384DA-9F46-43C2-9BCB-27EE702B40CD}";
				this.mapData.desc.DescImage = mapConfig.Desc.DescImage ||
					"{04F9EB89-888C-435E-965B-DC7BDFA63395}";
				this.mapData.desc.DescMon = mapConfig.Desc.DescMon || ["fvm:normal_mouse",
				"fvm:football_mouse"];
				this.mapData.desc.DescBoss = mapConfig.Desc.DescBoss || "洞君";
				this.mapData.desc.DescBossLib = mapConfig.Desc.DescBossLib || "";
				this.mapData.desc.DescBossImage = mapConfig.Desc.DescBossImage || "";
			}

			// 更新前景
			if (mapConfig.Foreground) {
				this.mapData.foreground.lib = mapConfig.Foreground.Lib || "";
				this.mapData.foreground.img = mapConfig.Foreground.Img || "";
				this.mapData.foreground.x = mapConfig.Foreground.X || 211;
				this.mapData.foreground.y = mapConfig.Foreground.Y || 100;
			}

			// 更新背景
			if (mapConfig.Background) {
				this.mapData.background.lib = mapConfig.Background.Lib || "";
				this.mapData.background.img = mapConfig.Background.Img || "";
				this.mapData.background.offsetX = mapConfig.Background.OffsetX || -82;
				this.mapData.background.offsetY = mapConfig.Background.OffsetY || 0;
			}
			
			// 解析Effects数组
			const effectArr = mapConfig.Effects;
			if (effectArr && Array.isArray(effectArr)) {
				this.mapData.effects = []; // 清空旧effects
				effectArr.forEach(effectObj => {
					// 注意：这里使用effectObj而不是TempObject
					this.mapData.effects.push({
						X: effectObj.X || 0,
						Y: effectObj.Y || 0,
						Lib: effectObj.Lib || "", // 使用effectObj
						Img: effectObj.Img || "", // 添加Img字段用于兼容Delphi代码中的bug
						Index: effectObj.Index || 1,
						Count: effectObj.Count || 1,
						Speed: effectObj.Speed || 5
					});
				});
			}
			
			// 限时模式
			if (mapConfig.TimeLimit) {
			  this.mapData.timeLimit.enabled = mapConfig.TimeLimit.Enabled;
			  this.mapData.timeLimit.seconds = mapConfig.TimeLimit.Seconds;
			} else {
			  this.mapData.timeLimit.enabled = false;
			  this.mapData.timeLimit.seconds = 60;
			}

			// 更新阳光设置
			if (mapConfig.Sunlight) {
				this.mapData.sunlight.drop = mapConfig.Sunlight.Drop || false;
				this.mapData.sunlight.baseCount = mapConfig.Sunlight.BaseCount || 50;
				this.mapData.sunlight.maxCount = mapConfig.Sunlight.MaxCount || 9999;
				this.mapData.sunlight.escape = mapConfig.Sunlight.Escape || 600;
				this.mapData.sunlight.dealt = mapConfig.Sunlight.Dealt || 550;
				this.mapData.sunlight.mode = mapConfig.Sunlight.Mode || 1;
			}
			
			// 经验、警告
			this.mapData.defExp = mapConfig.DefExp !== undefined ? mapConfig.DefExp : 5000;
			this.mapData.defExpDelta = mapConfig.DefMapExpDelta !== undefined ? mapConfig.DefMapExpDelta : 5000;
			this.mapData.warnMsg = mapConfig.WarnMsg || "";
			
			// 洞穴相关
			this.mapData.holeCol = mapConfig.HoleCol !== undefined ? mapConfig.HoleCol : 0;
			this.mapData.holeMon = mapConfig.HoleMon && Array.isArray(mapConfig.HoleMon) ? mapConfig.HoleMon : [];
			this.mapData.holeGenBase = mapConfig.HoleGenBase !== undefined ? mapConfig.HoleGenBase : 0;
			this.mapData.holeGenDelta = mapConfig.HoleGenDelta !== undefined ? mapConfig.HoleGenDelta : 0;
			this.mapData.holeSpawnBase = mapConfig.HoleSpawnBase !== undefined ? mapConfig.HoleSpawnBase : 0;
			this.mapData.holeSpawnDelta = mapConfig.HoleSpawnDelta !== undefined ? mapConfig.HoleSpawnDelta : 0;

			// 处理CellDef
			if (mapConfig.CellDef) {
				const cellDef = mapConfig.CellDef;

				// 更新网格设置
				this.mapData.gridCols = cellDef.Col || 9;
				this.mapData.gridRows = cellDef.Row || 7;
				// 从CellDef中获取terrain，如果没有则使用默认值0
				this.mapData.terrain = cellDef.terrain !== undefined ? cellDef.terrain : 0;

				console.log(`网格大小: ${this.mapData.gridCols}x${this.mapData.gridRows}`);
				console.log(`默认地形: ${this.mapData.terrain}`);

				// 初始化单元格数组 - 清空旧cells
				this.mapData.cells = [];
				for (let row = 0; row < this.mapData.gridRows; row++) {
					this.mapData.cells[row] = [];
					for (let col = 0; col < this.mapData.gridCols; col++) {
						this.mapData.cells[row][col] = {
							x: col,
							y: row,
							width: 1,
							height: 1,
							type: this.mapData.terrain, // 使用默认地形
							weather: 0,
							virtualZ: 0.0,
							prePlant: []
						};
					}
				}

				// 解析Cells数组
				if (cellDef.Cells && Array.isArray(cellDef.Cells)) {
					console.log(`找到 ${cellDef.Cells.length} 个单元格配置`);

					cellDef.Cells.forEach((cellData, index) => {
						try {
							const col = cellData.X; // 列
							const row = cellData.Y; // 行

							if (row >= 0 && row < this.mapData.gridRows &&
								col >= 0 && col < this.mapData.gridCols) {

								// 使用单元格特定的type，如果不存在则使用默认地形
								const cellType = cellData.type !== undefined ? cellData.type : this
									.mapData.terrain;

								// 创建单元格对象
								const cell = {
									x: col,
									y: row,
									width: cellData.Col || 1,
									height: cellData.Row || 1,
									type: cellType, // 使用单元格特定的类型或默认地形
									weather: cellData.weather || 0,
									virtualZ: cellData.Z || 0.0,
									prePlant: []
								};

								// 解析PrePlace配置
								if (cellData.PrePlace) {
									if (Array.isArray(cellData.PrePlace)) {
										// PrePlace 是数组
										cell.prePlant = cellData.PrePlace.map(pp => ({
											noSuchCard: pp.NoSuchCard || "",
											selectable: pp.Selectable || []
										}));
									} else {
										// PrePlace 是单个对象
										cell.prePlant = [{
											noSuchCard: cellData.PrePlace.NoSuchCard || "",
											selectable: cellData.PrePlace.Selectable || []
										}];
									}
								}

								// 更新单元格
								this.mapData.cells[row][col] = cell;
							}
						} catch (error) {
							console.error(`解析单元格 ${index} 时出错:`, error);
						}
					});
				} else {
					console.warn("没有找到Cells数组或格式不正确");
				}
			} else {
				console.warn("JSON中没有CellDef配置");
			}

			// 更新波次配置 - 清空旧waves
			this.mapData.waves = [];
			if (mapConfig.Waves && Array.isArray(mapConfig.Waves)) {
				console.log(`找到 ${mapConfig.Waves.length} 个波次`);

				// 重新解析波次结构
				this.mapData.waves = this.parseWaves(mapConfig.Waves);
			} else {
				console.warn("没有找到Waves数组或格式不正确");
			}
			
			// 处理 Carts
			if (mapConfig.Carts && Array.isArray(mapConfig.Carts)) {
				// 确保长度与行数一致
				this.mapData.carts = mapConfig.Carts.slice(0, this.mapData.gridRows);
				// 如果长度不足，补齐 0
				while (this.mapData.carts.length < this.mapData.gridRows) {
					this.mapData.carts.push(0);
				}
			} else {
				// 无 Carts 字段，初始化为全 0
				this.mapData.carts = new Array(this.mapData.gridRows).fill(0);
			}
			
			// 空洞生成模式
			if (mapConfig.CottonCandyHoleGen) {
			    this.mapData.cottonCandyHoleGen.mode = mapConfig.CottonCandyHoleGen.mode || "columnRandom";
			    this.mapData.cottonCandyHoleGen.interval = mapConfig.CottonCandyHoleGen.interval || 5.0;
			} else {
			    this.mapData.cottonCandyHoleGen = { mode: "columnRandom", interval: 5.0 };
			}
			
			// 解析棉花糖区域
			if (mapConfig.CottonCandyZones && Array.isArray(mapConfig.CottonCandyZones)) {
			    this.mapData.cottonCandyZones = mapConfig.CottonCandyZones.map(zone => ({
			        start_row: zone.start_row,
			        end_row: zone.end_row,
			        start_col: zone.start_col,
			        end_col: zone.end_col
			    }));
			}
			
			// 解析平台组
			if (mapConfig.PlatformGroups && Array.isArray(mapConfig.PlatformGroups)) {
			    this.mapData.platformGroups = mapConfig.PlatformGroups.map(pg => ({
			        start_frame: pg.start_frame || 0,
			        loop: pg.loop || false,
			        image_lib: pg.image_lib || "",
			        image: pg.image || "",
			        cells: pg.cells || [],
			        steps: pg.steps || []
			    }));
			}
			

			// 更新UI
			this.updateUI();
			this.renderGrid();
			this.renderWavesUI();
			this.renderEffectsUI();
			this.renderCottonCandyZonesUI();
			this.renderPlatformGroupsUI();
			

			console.log("地图加载完成，数据已完全重置");
			// alert(`地图 ${this.mapData.mapName} 加载成功`);
		} catch (error) {
			console.error("加载地图数据时出错:", error);
			alert("加载地图失败: " + error.message);
		}
	},

	// 新增函数：解析波次数据
	parseWaves: function(wavesData) {
		const waves = [];

		wavesData.forEach((waveArray, waveIndex) => {
			const waveConfig = {
				tasks: []
			};

			if (Array.isArray(waveArray)) {
				waveArray.forEach((taskObj, taskIndex) => {
					const task = {
						start_frame: taskObj.start_frame || 0,
						wait_previous: taskObj.wait_previous !== undefined ? taskObj
							.wait_previous : true,
							
						max_wait_previous_frames: taskObj.max_wait_previous_frames || 900,
						
						overlap_protection: taskObj.overlap_protection !== undefined ?
							taskObj.overlap_protection : true,
						progress: taskObj.progress || 0.0,
						is_big_wave: taskObj.is_big_wave || false,
						nextHint: taskObj.nexthint || false,
						isFinalHint: taskObj.finalhint || false,
						resetToProgress: taskObj.resettoprogress || false,
						changeBGM: taskObj.changebgm || false,
						BGM: taskObj.bgm || -1,
						is_boss_wave: taskObj.is_boss_wave || false,
						boss_type: taskObj.boss_type || "none",
						infiniteLoopWaveId: taskObj.infinite_loop_wave_id || -1,
						infiniteLoopActive: false,
						infiniteLoopMonsters: [],
						bossCount: 0,
						bossDeathCount: 0,
						monsters: [],
						bossHealthBarConfig: {
							barMode: "single",
							healthBarLib: "",
							healthBarBackground: "",
							healthBarForeground: "",
							singleBoss: {
								bossId: "",
								bossName: "",
								avatarLib: "",
								avatarImage: "",
								positionX: 0,
								positionY: 0,
								width: 300,
								height: 30
							},
							baseX: 0,
							baseY: 0,
							baseWidth: 300,
							baseHeight: 30,
							doubleBosses: []
						}
					};

					// 解析无限循环怪物
					if (taskObj.infinite_loop_monsters && Array.isArray(taskObj
							.infinite_loop_monsters)) {
						taskObj.infinite_loop_monsters.forEach(monsterObj => {
							task.infiniteLoopMonsters.push({
								id: monsterObj.id || "",
								count: monsterObj.count || 0,
								interval: monsterObj.interval || 100,
								row: monsterObj.row !== undefined ? monsterObj
									.row : -1,
								is_boss: false,
								avoid: monsterObj.avoid || []
							});
						});
					}

					// 解析BOSS血条配置
					if (taskObj.boss_health_bar) {
						const healthBar = taskObj.boss_health_bar;
						task.bossHealthBarConfig.barMode = healthBar.mode || "single";
						task.bossHealthBarConfig.healthBarLib = healthBar.health_bar_lib || "";
						task.bossHealthBarConfig.healthBarBackground = healthBar
							.health_bar_background || "";
						task.bossHealthBarConfig.healthBarForeground = healthBar
							.health_bar_foreground || "";

						if (task.bossHealthBarConfig.barMode === 'single' && healthBar
							.single_boss) {
							task.bossHealthBarConfig.singleBoss = {
								bossId: healthBar.single_boss.boss_id || "",
								bossName: healthBar.single_boss.name || "",
								avatarLib: healthBar.single_boss.avatar_lib || "",
								avatarImage: healthBar.single_boss.avatar_image || "",
								positionX: healthBar.single_boss.x || 0,
								positionY: healthBar.single_boss.y || 0,
								width: healthBar.single_boss.width || 300,
								height: healthBar.single_boss.height || 30
							};
						} else if (task.bossHealthBarConfig.barMode === 'double') {
							task.bossHealthBarConfig.baseX = healthBar.x || 0;
							task.bossHealthBarConfig.baseY = healthBar.y || 0;
							task.bossHealthBarConfig.baseWidth = healthBar.width || 300;
							task.bossHealthBarConfig.baseHeight = healthBar.height || 30;

							if (healthBar.double_bosses && Array.isArray(healthBar
									.double_bosses)) {
								healthBar.double_bosses.forEach((bossObj, index) => {
									task.bossHealthBarConfig.doubleBosses.push({
										bossId: bossObj.boss_id || "",
										bossName: bossObj.name || "",
										avatarLib: bossObj.avatar_lib || "",
										avatarImage: bossObj.avatar_image || "",
										positionX: task.bossHealthBarConfig
											.baseX,
										positionY: task.bossHealthBarConfig
											.baseY + (index * (task
												.bossHealthBarConfig
												.baseHeight + 10)),
										width: task.bossHealthBarConfig
											.baseWidth,
										height: task.bossHealthBarConfig
											.baseHeight
									});
								});
							}
						}
					}

					// 解析怪物
					if (taskObj.monsters && Array.isArray(taskObj.monsters)) {
						// 新格式：monsters数组
						taskObj.monsters.forEach(monsterObj => {
							task.monsters.push({
								id: monsterObj.id || "",
								count: monsterObj.count || 0,
								interval: monsterObj.interval || 100,
								row: monsterObj.row !== undefined ? monsterObj
									.row : -1,
								is_boss: monsterObj.is_boss || false,
								avoid: monsterObj.avoid || []
							});
						});
					} else if (taskObj.id) {
						// 旧格式：单个怪物
						task.monsters.push({
							id: taskObj.id || "",
							count: taskObj.count || 0,
							interval: taskObj.interval || 100,
							row: taskObj.row !== undefined ? taskObj.row : -1,
							is_boss: taskObj.is_boss || false,
							avoid: taskObj.avoid || []
						});
					}

					waveConfig.tasks.push(task);
				});
			}

			waves.push(waveConfig);
		});

		return waves;
	},

	// 更新UI
	updateUI: function() {
		// 更新地图属性
		document.getElementById('mapId').value = this.mapData.mapId;
		document.getElementById('mapName').value = this.mapData.mapName;
		document.getElementById('defCellWidth').value = this.mapData.defCellWidth;
		document.getElementById('defCellHeight').value = this.mapData.defCellHeight;
		document.getElementById('time').value = this.mapData.time;
		document.getElementById('fogCols').value = this.mapData.fogCols;
		document.getElementById('startFrame').value = this.mapData.startFrame;
		document.getElementById('terrainType').value = this.mapData.terrain;
		
		// 进阶属性
		document.getElementById('defExp').value = this.mapData.defExp;
		document.getElementById('defExpDelta').value = this.mapData.defExpDelta;
		document.getElementById('warnMsg').value = this.mapData.warnMsg||"";
		
		// 洞穴设置
		document.getElementById('holeCol').value = this.mapData.holeCol;
		const holeMon = this.mapData.holeMon;
		if (Array.isArray(holeMon)) {
		    document.getElementById('holeMon').value = holeMon.join(', ');
		} else {
		    document.getElementById('holeMon').value = '';
		}
		document.getElementById('holeGenBase').value = this.mapData.holeGenBase;
		document.getElementById('holeGenDelta').value = this.mapData.holeGenDelta;
		document.getElementById('holeSpawnBase').value = this.mapData.holeSpawnBase;
		document.getElementById('holeSpawnDelta').value = this.mapData.holeSpawnDelta;

		// 更新网格设置
		document.getElementById('gridCols').value = this.mapData.gridCols;
		document.getElementById('gridRows').value = this.mapData.gridRows;

		// 更新资源设置
		document.getElementById('backgroundLib').value = this.mapData.background.lib;
		document.getElementById('backgroundImage').value = this.mapData.background.img;
		document.getElementById('backgroundOffsetX').value = this.mapData.background.offsetX;
		document.getElementById('backgroundOffsetY').value = this.mapData.background.offsetY;

		document.getElementById('foregroundLib').value = this.mapData.foreground.lib;
		document.getElementById('foregroundImage').value = this.mapData.foreground.img;
		document.getElementById('foregroundOffsetX').value = this.mapData.foreground.x;
		document.getElementById('foregroundOffsetY').value = this.mapData.foreground.y;

		document.getElementById('generateSunlight').value = this.mapData.sunlight.drop.toString();
		document.getElementById('maxSunlight').value = this.mapData.sunlight.maxCount;
		document.getElementById('currentFireCount').value = this.mapData.sunlight.baseCount;
		document.getElementById('defBgm').value = this.mapData.defBgm;

		// 更新选中的单元格类型
		this.setSelectedCellType(this.selectedCellType);


		document.getElementById('descText').value = this.mapData.desc.Text || "";
		document.getElementById('descLib').value = this.mapData.desc.DescLib || "";
		document.getElementById('descImage').value = this.mapData.desc.DescImage || "";
		document.getElementById('descMon').value = this.mapData.desc.DescMon ? this.mapData.desc.DescMon.join(
			', ') : "";
		document.getElementById('descBoss').value = this.mapData.desc.DescBoss || "";
		document.getElementById('descBossLib').value = this.mapData.desc.DescBossLib || "";
		document.getElementById('descBossImage').value = this.mapData.desc.DescBossImage || "";
		
		// 限时模式
		const enabledSelect = document.getElementById('timeLimitEnabled');
		enabledSelect.value = this.mapData.timeLimit.enabled.toString();
		document.getElementById('timeLimitSeconds').value = this.mapData.timeLimit.seconds;
		const secondsGroup = document.getElementById('timeLimitSecondsGroup');
		secondsGroup.style.display = this.mapData.timeLimit.enabled ? 'block' : 'none';
		
		const modeSelect = document.getElementById('holeGenMode');
		if (modeSelect) {
		    modeSelect.value = this.mapData.cottonCandyHoleGen.mode;
		    const intervalGroup = document.getElementById('timedIntervalGroup');
		    intervalGroup.style.display = this.mapData.cottonCandyHoleGen.mode === 'timed' ? 'block' : 'none';
		    document.getElementById('timedInterval').value = this.mapData.cottonCandyHoleGen.interval;
		}


		// 更新地图标题
		this.updateMapTitle();
	},

	// 渲染特效UI
	renderEffectsUI: function() {
		const container = document.getElementById('effectsContainer');
		if (!container) return;

		let html = '';

		this.mapData.effects.forEach((effect, index) => {
			html += `
                    <div class="wave-item" data-index="${index}">
                        <div class="wave-header">
                            <div class="wave-title">特效 ${index + 1}</div>
                            <div>
                                <button class="btn edit-effect" style="padding: 2px 5px; font-size: 0.8rem;">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="btn btn-danger delete-effect" style="padding: 2px 5px; font-size: 0.8rem;">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                        <div class="task-item">
                            <div><strong>位置:</strong> X=${effect.X}, Y=${effect.Y}</div>
                            <div><strong>资源:</strong> ${effect.Lib || '无'}</div>
                            <div><strong>索引:</strong> ${effect.Index}</div>
                            <div><strong>数量:</strong> ${effect.Count}</div>
                            <div><strong>速度:</strong> ${effect.Speed}</div>
                        </div>
                    </div>
                    `;
		});

		if (html === '') {
			html = '<div class="form-control" style="text-align: center; padding: 20px;">暂无特效配置</div>';
		}

		container.innerHTML = html;

		// 绑定事件
		container.querySelectorAll('.edit-effect').forEach(btn => {
			btn.addEventListener('click', (e) => {
				const index = parseInt(e.target.closest('.wave-item').dataset.index);
				this.editEffect(index);
			});
		});

		container.querySelectorAll('.delete-effect').forEach(btn => {
			btn.addEventListener('click', (e) => {
				const index = parseInt(e.target.closest('.wave-item').dataset.index);
				this.deleteEffect(index);
			});
		});
	},

	// 编辑特效
	editEffect: function(index) {
		const effect = this.mapData.effects[index];

		const html = `
                <div class="form-group">
                    <label>X坐标</label>
                    <input type="number" id="effectX" class="form-control" value="${effect.X}" step="0.1">
                </div>
                <div class="form-group">
                    <label>Y坐标</label>
                    <input type="number" id="effectY" class="form-control" value="${effect.Y}" step="0.1">
                </div>
                <div class="form-group">
                    <label>资源库</label>
                    <input type="text" id="effectLib" class="form-control" value="${effect.Lib || ''}">
                </div>
                <div class="form-group">
                    <label>索引</label>
                    <input type="number" id="effectIndex" class="form-control" value="${effect.Index || 1}">
                </div>
                <div class="form-group">
                    <label>数量</label>
                    <input type="number" id="effectCount" class="form-control" value="${effect.Count || 1}">
                </div>
                <div class="form-group">
                    <label>速度</label>
                    <input type="number" id="effectSpeed" class="form-control" value="${effect.Speed || 5}">
                </div>
                `;

		const modal = document.createElement('div');
		modal.className = 'modal';
		modal.style.display = 'flex';

		modal.innerHTML = `
                <div class="modal-content" style="max-width: 500px;">
                    <div class="modal-header">
                        <h3>编辑特效</h3>
                        <span class="close-modal">&times;</span>
                    </div>
                    <div class="modal-body">
                        ${html}
                        <div class="btn-group" style="margin-top: 20px;">
                            <button id="saveEffectBtn" class="btn btn-primary">保存</button>
                            <button class="btn close-modal">取消</button>
                        </div>
                    </div>
                </div>
                `;

		document.body.appendChild(modal);

		modal.querySelector('.close-modal').addEventListener('click', () => {
			document.body.removeChild(modal);
		});

		modal.querySelector('#saveEffectBtn').addEventListener('click', () => {
			this.mapData.effects[index] = {
				X: parseFloat(document.getElementById('effectX').value),
				Y: parseFloat(document.getElementById('effectY').value),
				Lib: document.getElementById('effectLib').value,
				Index: parseInt(document.getElementById('effectIndex').value),
				Count: parseInt(document.getElementById('effectCount').value),
				Speed: parseInt(document.getElementById('effectSpeed').value)
			};

			this.renderEffectsUI();
			document.body.removeChild(modal);
		});

		// 点击模态框外部关闭
		modal.addEventListener('click', (e) => {
			if (e.target === modal) {
				document.body.removeChild(modal);
			}
		});
	},

	// 删除特效
	deleteEffect: function(index) {
		if (confirm("确定要删除这个特效吗？")) {
			this.mapData.effects.splice(index, 1);
			this.renderEffectsUI();
		}
	},

	// 添加特效
	addEffect: function() {
		const newEffect = {
			X: 0,
			Y: 0,
			Lib: "effects",
			Index: 1,
			Count: 10,
			Speed: 5
		};

		this.mapData.effects.push(newEffect);
		this.renderEffectsUI();
	},

	// 保存地图
	saveMap: function() {
		const jsonData = this.generateJsonData();
		const jsonString = JSON.stringify(jsonData, null, 2);

		// 创建下载链接
		const blob = new Blob([jsonString], {
			type: 'application/json'
		});
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `${this.mapData.mapId}.json`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);

		alert(`地图已保存为 ${this.mapData.mapId}.json`);
	},
	
	// 显示快速生成波次对话框
	showQuickWaveModal: function() {
	    const modal = document.getElementById('quickWaveModal');
	    const requiredContainer = document.getElementById('requiredMonstersContainer');
	    
	    // 清空并添加一个默认的必刷怪物条目
	    requiredContainer.innerHTML = '';
	    this.addRequiredMonsterRow(requiredContainer);
	    
	    // 绑定添加必刷怪物按钮
	    document.getElementById('addRequiredMonsterBtn').onclick = () => {
	        this.addRequiredMonsterRow(requiredContainer);
	    };
	    
	    // 绑定生成按钮
	    document.getElementById('generateQuickWaveBtn').onclick = () => {
	        this.generateQuickWave();
	    };
	    
	    // 绑定关闭按钮（模态框内的关闭按钮和取消按钮）
	    modal.querySelectorAll('.close-modal').forEach(btn => {
	        btn.onclick = () => { modal.style.display = 'none'; };
	    });
	    
	    // 点击背景关闭
	    modal.onclick = (e) => {
	        if (e.target === modal) modal.style.display = 'none';
	    };
	    
	    modal.style.display = 'flex';
	},
	
	// 添加一行必刷怪物输入
	addRequiredMonsterRow: function(container) {
	    const row = document.createElement('div');
	    row.className = 'required-monster-row';
	    row.style.display = 'flex';
	    row.style.gap = '5px';
	    row.style.marginBottom = '5px';
	    
	    const idInput = document.createElement('input');
	    idInput.type = 'text';
	    idInput.className = 'form-control';
	    idInput.placeholder = '怪物ID';
	    idInput.value = 'zombie_normal';
	    idInput.style.flex = '2';
	    
	    const countInput = document.createElement('input');
	    countInput.type = 'number';
	    countInput.className = 'form-control';
	    countInput.placeholder = '数量';
	    countInput.value = '10';
	    countInput.min = '1';
	    countInput.style.flex = '1';
	    
	    const removeBtn = document.createElement('button');
	    removeBtn.type = 'button';
	    removeBtn.className = 'btn';
	    removeBtn.innerHTML = '<i class="fas fa-times"></i>';
	    removeBtn.style.padding = '0 8px';
	    removeBtn.onclick = function() {
	        row.remove();
	    };
	    
	    row.appendChild(idInput);
	    row.appendChild(countInput);
	    row.appendChild(removeBtn);
	    container.appendChild(row);
	},
	
	// 生成快速波次
	generateQuickWave: function() {
	    const totalCount = parseInt(document.getElementById('quickTotalCount').value);
	    if (isNaN(totalCount) || totalCount <= 0) {
	        alert('总数量必须为正整数');
	        return;
	    }
	    
	    // 收集必刷怪物
	    const requiredRows = document.querySelectorAll('.required-monster-row');
	    const requiredMonsters = [];
	    let requiredSum = 0;
	    for (let row of requiredRows) {
	        const inputs = row.querySelectorAll('input');
	        const id = inputs[0].value.trim();
	        const count = parseInt(inputs[1].value);
	        if (!id) {
	            alert('必刷怪物ID不能为空');
	            return;
	        }
	        if (isNaN(count) || count <= 0) {
	            alert('必刷怪物数量必须为正整数');
	            return;
	        }
	        requiredMonsters.push({ id, count });
	        requiredSum += count;
	    }
	    
	    if (requiredSum > totalCount) {
	        alert(`必刷怪物总数(${requiredSum})超过了总数量(${totalCount})`);
	        return;
	    }
	    
	    // 获取填充怪物ID列表
	    const fillerIdsStr = document.getElementById('fillerMonsterIds').value.trim();
	    const fillerIds = fillerIdsStr ? fillerIdsStr.split(',').map(s => s.trim()).filter(id => id) : [];
	    
	    const remaining = totalCount - requiredSum;
	    if (remaining > 0 && fillerIds.length === 0) {
	        alert('剩余数量大于0，但未指定填充怪物ID');
	        return;
	    }
	    
	    // 分配剩余数量给填充怪物（随机分配）
	    const fillerMonsters = [];
	    if (remaining > 0 && fillerIds.length > 0) {
	        // 先给每种填充怪物至少分配1只（如果剩余数量足够）
	        const minPerFiller = Math.min(1, Math.floor(remaining / fillerIds.length));
	        let allocated = 0;
	        const counts = new Array(fillerIds.length).fill(0);
	        
	        // 保证每种至少 minPerFiller 只
	        for (let i = 0; i < fillerIds.length; i++) {
	            counts[i] = minPerFiller;
	            allocated += minPerFiller;
	        }
	        
	        // 剩余数量随机分配
	        let left = remaining - allocated;
	        while (left > 0) {
	            const idx = Math.floor(Math.random() * fillerIds.length);
	            counts[idx]++;
	            left--;
	        }
	        
	        // 打乱一下顺序让分布更自然（可选）
	        for (let i = counts.length - 1; i > 0; i--) {
	            const j = Math.floor(Math.random() * (i + 1));
	            [counts[i], counts[j]] = [counts[j], counts[i]];
	        }
	        
	        for (let i = 0; i < fillerIds.length; i++) {
	            if (counts[i] > 0) {
	                fillerMonsters.push({ id: fillerIds[i], count: counts[i] });
	            }
	        }
	    }
	    
	    // 合并所有怪物（先必刷，后填充）
	    const allMonsters = [...requiredMonsters, ...fillerMonsters];
	    
	    // 获取间隔范围
	    const intervalMin = parseInt(document.getElementById('intervalMin').value) || 60;
	    const intervalMax = parseInt(document.getElementById('intervalMax').value) || 180;
	    const effectiveMin = Math.min(intervalMin, intervalMax);
	    const effectiveMax = Math.max(intervalMin, intervalMax);
	    
	    // 生成任务列表
	    const tasks = [];
	    let currentFrame = 0;
	    
	    allMonsters.forEach((monster, index) => {
	        const task = {
	            start_frame: currentFrame,
	            wait_previous: true,
	            overlap_protection: true,
	            progress: 0.0,
	            is_big_wave: false,
	            nextHint: false,
	            resetToProgress: false,
	            changeBGM: false,
	            BGM: -1,
	            isFinalHint: false,
	            is_boss_wave: false,
	            boss_type: "none",
	            infiniteLoopWaveId: -1,
	            infiniteLoopActive: false,
	            infiniteLoopMonsters: [],
	            bossCount: 0,
	            bossDeathCount: 0,
	            monsters: [{
	                id: monster.id,
	                count: monster.count,
	                interval: 100,   // 默认间隔，后续可手动调整
	                row: -1,
	                is_boss: false,
	                avoid: []
	            }],
	            bossHealthBarConfig: {
	                barMode: "single",
	                healthBarLib: "",
	                healthBarBackground: "",
	                healthBarForeground: "",
	                singleBoss: {
	                    bossId: "",
	                    bossName: "",
	                    avatarLib: "",
	                    avatarImage: "",
	                    positionX: 0,
	                    positionY: 0,
	                    width: 300,
	                    height: 30
	                },
	                baseX: 0,
	                baseY: 0,
	                baseWidth: 300,
	                baseHeight: 30,
	                doubleBosses: []
	            }
	        };
	        tasks.push(task);
	        
	        // 计算下一个任务的起始帧（随机间隔）
	        const interval = Math.floor(Math.random() * (effectiveMax - effectiveMin + 1)) + effectiveMin;
	        currentFrame += interval;
	    });
	    
	    // 创建波次对象
	    const newWave = { tasks: tasks };
	    this.mapData.waves.push(newWave);
	    
	    // 刷新波次UI
	    this.renderWavesUI();
	    
	    // 关闭模态框
	    document.getElementById('quickWaveModal').style.display = 'none';
	    
	    alert(`成功生成波次，共 ${tasks.length} 个任务，总计 ${totalCount} 只怪物。`);
	},
	
	// ========== 通用刷怪模板生成器（带权重） ==========
	
	// 显示模板生成对话框
	showTemplateWaveModal: function() {
	    
	    const modal = document.getElementById('templateWaveModal');
	    
	    // 清空并添加默认示例（模仿0x0007.lua：第8波洞君，第10波阿诺）
	    const container = document.getElementById('midBossesContainer');
	    container.innerHTML = '';
	    this.addMidBossRow('fvm:hole_lord', '8');
	    this.addMidBossRow('fvm:arno', '10');
	    
	    document.getElementById('templateNormalIds').value = 
	        'fvm:normal_mouse:10, fvm:football_mouse:8, fvm:pot_mouse:6, fvm:renzhe_mouse:5, fvm:giant_mouse:4';
	    document.getElementById('templateBossId').value = 'fvm:pharaoh_prototype';
	    document.getElementById('templateWaveCount').value = 14;
	    
	    modal.style.display = 'flex';
	    document.getElementById('generateTemplateBtn').onclick = () => this.generateTemplateWaves();
	},
	
	addMidBossRow: function(bossId = '', wave = '') {
	    const container = document.getElementById('midBossesContainer');
	    const row = document.createElement('div');
	    row.className = 'mid-boss-row';
	    row.style.display = 'flex';
	    row.style.gap = '5px';
	    row.style.marginBottom = '5px';
	    
	    const waveInput = document.createElement('input');
	    waveInput.type = 'number';
	    waveInput.className = 'form-control mid-boss-wave';
	    waveInput.placeholder = '波次';
	    waveInput.value = wave;
	    waveInput.min = 1;
	    waveInput.style.flex = '1';
	    
	    const idInput = document.createElement('input');
	    idInput.type = 'text';
	    idInput.className = 'form-control mid-boss-id';
	    idInput.placeholder = 'BOSS ID';
	    idInput.value = bossId;
	    idInput.style.flex = '3';
	    
	    const removeBtn = document.createElement('button');
	    removeBtn.type = 'button';
	    removeBtn.className = 'btn btn-sm';
	    removeBtn.innerHTML = '<i class="fas fa-times"></i>';
	    removeBtn.style.padding = '0 8px';
	    removeBtn.style.background = '#dc3545';
	    removeBtn.style.color = 'white';
	    removeBtn.addEventListener('click', () => row.remove());
	    
	    row.appendChild(waveInput);
	    row.appendChild(idInput);
	    row.appendChild(removeBtn);
	    container.appendChild(row);
	},
	
	
	// 解析带权重的怪物字符串
	// 解析带权重的怪物字符串（修复ID中包含冒号的问题）
	parseWeightedMonsters: function(inputStr) {
	    if (!inputStr) return [];
	    
	    return inputStr.split(',').map(item => {
	        const trimmed = item.trim();
	        if (!trimmed) return null;
	        
	        // 找到最后一个冒号的位置作为权重分隔符
	        const lastColonIndex = trimmed.lastIndexOf(':');
	        let id, weight;
	        
	        if (lastColonIndex > 0) {
	            id = trimmed.substring(0, lastColonIndex).trim();
	            const weightStr = trimmed.substring(lastColonIndex + 1).trim();
	            weight = parseFloat(weightStr);
	            // 如果权重部分解析失败，则默认为10，且认为整个字符串都是ID
	            if (isNaN(weight)) {
	                id = trimmed;
	                weight = 10;
	            }
	        } else {
	            // 没有冒号，整个字符串作为ID，权重默认10
	            id = trimmed;
	            weight = 10;
	        }
	        
	        return { id, weight: Math.max(1, weight) };
	    }).filter(m => m && m.id);
	},
	
	// 创建 BOSS 任务（中场或最终）
	createBossTask: function(monsterPool, bossId, bossType, waveIndex, progress) {
	    const isFinal = (bossType === 'final');
	    const task = {
	        start_frame: 0,
	        wait_previous: true,
	        overlap_protection: true,
	        progress: progress,
	        is_big_wave: false,
	        nexthint: false,
	        finalhint: isFinal,
	        resettoprogress: false,
	        changebgm: isFinal,      // 只有最终BOSS才切换BGM
	        bgm: isFinal ? 2 : -1,
	        is_boss_wave: true,
	        boss_type: bossType,
	        infiniteLoopWaveId: -1,
	        infiniteLoopActive: false,
	        infiniteLoopMonsters: [],
	        monsters: [],
	        bossHealthBarConfig: null
	    };
	    
	    // BOSS 本体
	    task.monsters.push({
	        id: bossId,
	        count: 1,
	        interval: 400,
	        row: -1,
	        is_boss: true,
	        avoid: []
	    });
	    
	    // 无限小怪（选取权重最高的前3种）
	    const loopMonsters = monsterPool.slice(0, Math.min(monsterPool.length, 3));
	    task.infinite_loop_monsters = loopMonsters.map(m => ({
	        id: m.id,
	        count: 10,
	        interval: 80 + Math.floor(Math.random() * 70),
	        row: -1,
	        avoid: []
	    }));
	    
	    // 基础血条配置
	    task.bossHealthBarConfig = {
	        barMode: "single",
	        healthBarLib: "",
	        healthBarBackground: "",
	        healthBarForeground: "",
	        singleBoss: {
	            bossId: bossId,
	            bossName: bossId,
	            avatarLib: "",
	            avatarImage: "",
	            positionX: 300,
	            positionY: 500,
	            width: 500,
	            height: 20
	        },
	        baseX: 0,
	        baseY: 0,
	        baseWidth: 300,
	        baseHeight: 30,
	        doubleBosses: []
	    };
	    
	    return task;
	},
	
	// 核心生成逻辑
	generateTemplateWaves: function() {
	    const normalInput = document.getElementById('templateNormalIds').value;
	    const finalBossId = document.getElementById('templateBossId').value.trim();
	    const waveCount = parseInt(document.getElementById('templateWaveCount').value) || 5;
	    
	    // 收集所有中场BOSS
	    const midBossRows = document.querySelectorAll('.mid-boss-row');
	    const midBossMap = new Map(); // key: waveIndex (0基), value: bossId
	    let hasError = false;
	    
	    midBossRows.forEach(row => {
	        const waveInput = row.querySelector('.mid-boss-wave');
	        const idInput = row.querySelector('.mid-boss-id');
	        const wave = parseInt(waveInput.value);
	        const bossId = idInput.value.trim();
	        
	        if (!bossId) return; // 忽略空ID
	        
	        if (isNaN(wave) || wave < 1 || wave > waveCount) {
	            alert(`中场BOSS波次必须在 1 到 ${waveCount} 之间，当前值：${wave}`);
	            hasError = true;
	            return;
	        }
	        
	        const waveIndex = wave - 1;
	        if (midBossMap.has(waveIndex)) {
	            alert(`波次 ${wave} 不能同时存在两个中场BOSS！`);
	            hasError = true;
	        }
	        midBossMap.set(waveIndex, bossId);
	    });
	    
	    if (hasError) return;
	    
	    // 校验最终BOSS波次不能与中场BOSS冲突
	    if (finalBossId && midBossMap.has(waveCount - 1)) {
	        alert(`最终BOSS波次(${waveCount})与中场BOSS冲突，请调整！`);
	        return;
	    }
	    
	    const weightedMonsters = this.parseWeightedMonsters(normalInput);
	    if (weightedMonsters.length === 0) {
	        alert('请至少输入一个普通怪物ID');
	        return;
	    }
	    
	    if (this.mapData.waves.length > 0) {
	        if (!confirm('⚠️ 当前已有波次配置，生成后将全部替换，是否继续？')) return;
	    }
	    
	    this.mapData.waves = [];
	    weightedMonsters.sort((a, b) => b.weight - a.weight);
	    
	    const progressStep = 1 / waveCount;
	    
	    for (let w = 0; w < waveCount; w++) {
	        const isLastWave = (w === waveCount - 1);
	        const isMidBossWave = midBossMap.has(w);
	        const isFinalBossWave = (isLastWave && finalBossId !== '');
	        const isBossWave = isMidBossWave || isFinalBossWave;
	        
	        // 大波规则：非BOSS波次中，偶数波为大波（第1波不算）
	        const isBigWave = !isBossWave && (w > 0 && w % 2 === 0);
	        
	        const wave = { tasks: [] };
	        const progressBase = w * progressStep;

	        // 可用怪物池：除了权重门槛，还要限制种类数量（前期只给1-2种）
			let availableMonsters = weightedMonsters.filter(m => {
				const minWave = Math.floor((10 - m.weight) * 0.3);
				return w >= Math.max(0, minWave);
			});
			
			// 新增：前期强制限制种类数量，让开局更简单
			if (w === 0) {
				// 第1波：只取权重最高的1种怪物
				availableMonsters = availableMonsters.slice(0, 1);
			} else if (w === 1) {
				// 第2波：最多2种
				availableMonsters = availableMonsters.slice(0, 2);
			} else if (w === 2) {
				// 第3波：最多3种
				availableMonsters = availableMonsters.slice(0, 3);
			}
			
			if (availableMonsters.length === 0) {
				availableMonsters.push(weightedMonsters[0]);
			}
	        
	        if (isMidBossWave) {
	            const bossId = midBossMap.get(w);
	            const task = this.createBossTask(availableMonsters, bossId, "mid", w, progressBase);
	            wave.tasks.push(task);
	        } else if (isFinalBossWave) {
	            const task = this.createBossTask(availableMonsters, finalBossId, "final", w, 1.0);
	            wave.tasks.push(task);
	        } else {
	            const taskCount = isBigWave ? 3 : 2;
	            for (let t = 0; t < taskCount; t++) {
	                const taskProgress = Math.min(progressBase + (t / taskCount) * progressStep, 1.0);
	                const task = this.createWeightedTemplateTask(
	                    availableMonsters,
	                    w,
	                    isBigWave && t === 0,
	                    taskProgress,
						isBossWave
	                );
	                wave.tasks.push(task);
	            }
	        }
	        
	        this.mapData.waves.push(wave);
	    }
	    
	    this.renderWavesUI();
	    document.getElementById('templateWaveModal').style.display = 'none';
	    alert(`✅ 成功生成 ${waveCount} 个波次！`);
	},
	
	// 创建单个任务（基于权重）
	createWeightedTemplateTask: function(monsterPool, waveIndex, isBigWave, progress) {
	    const task = {
	        start_frame: 0,
	        wait_previous: true,
	        overlap_protection: !isBigWave,
	        progress: progress,
	        is_big_wave: isBigWave,
	        nexthint: false,
	        finalhint: false,
	        resettoprogress: false,
	        changebgm: false,
	        bgm: -1,
	        is_boss_wave: false,
	        boss_type: "none",
	        infiniteLoopWaveId: -1,
	        infiniteLoopActive: false,
	        infiniteLoopMonsters: [],
	        monsters: [],
	        bossHealthBarConfig: null
	    };
	    
	    monsterPool.forEach(m => {
	        // 1. 出现概率：基础40% + 权重*2% + 波次*8%（前期低，后期高）
	        let appearChance = 0.4 + m.weight * 0.02 + waveIndex * 0.08;
	        if (isBigWave) appearChance += 0.15; // 大波加成降低
	        appearChance = Math.min(appearChance, 0.95);
	        
	        // 2. 概率判定
	        if (Math.random() > appearChance) return;
	        
	        // 3. 数量计算：基础值 = 权重 * (0.6 + 波次*0.2) ，让前期数量显著降低
	        let baseCount = Math.floor(m.weight * (0.6 + waveIndex * 0.2));
	        // 大波加成：前期加成少，后期加成多
	        const bigWaveMultiplier = isBigWave ? (1.0 + waveIndex * 0.1) : 1.0;
	        baseCount = Math.floor(baseCount * bigWaveMultiplier);
	        
	        // 4. 数量浮动 ±15%
	        const count = Math.max(1, Math.floor(baseCount * (0.85 + Math.random() * 0.3)));
	        
	        // 5. 间隔根据怪物权重和波次动态调整（权重高、波次靠后则间隔小，刷得快）
	        const baseInterval = 120 - waveIndex * 5;
	        const interval = Math.max(60, Math.floor(baseInterval + (10 - m.weight) * 5 + Math.random() * 40));
	        
	        task.monsters.push({
	            id: m.id,
	            count: count,
	            interval: interval,
	            row: -1,
	            is_boss: false,
	            avoid: []
	        });
	    });
	    
	    // 保底：如果没有任何怪物被选中，加入权重最高的怪物，数量较少
	    if (task.monsters.length === 0) {
	        const top = monsterPool[0];
	        task.monsters.push({
	            id: top.id,
	            count: Math.max(1, Math.floor(top.weight * 0.6)),
	            interval: 120,
	            row: -1,
	            is_boss: false,
	            avoid: []
	        });
	    }
	    
	    return task;
	},
	
	// 新建地图
	newMap: function() {
		// 完全重置mapData
		this.mapData = {
			mapId: "new_level",
			mapName: "新关卡",
			defCellWidth: 60,
			defCellHeight: 64,
			time: 12,
			fogCols: 0,
			startFrame: 0,
			defBgm: 1,
			terrain: 0,
			gridCols: 9,
			gridRows: 5,
			defExp: 5000,
			defExpDelta: 5000,
			warnMsg: "",
			holeCol: 0,
			holeMon: [],
			holeGenBase: 0,
			holeGenDelta: 0,
			holeSpawnBase: 0,
			holeSpawnDelta: 0,
			background: {
				lib: "backgrounds",
				img: "bg_grassland",
				offsetX: 0,
				offsetY: 0
			},
			foreground: {
				lib: "foregrounds",
				img: "fg_trees",
				x: 0,
				y: 0
			},
			sunlight: {
				drop: true,
				baseCount: 25,
				maxCount: 9999,
				escape: 600,
				dealt: 550,
				mode: 1
			},
			desc: {
				Text: "地图名\\天气\\模式\\攻击波数",
				DescLib: "{22B384DA-9F46-43C2-9BCB-27EE702B40CD}",
				DescImage: "{04F9EB89-888C-435E-965B-DC7BDFA63395}",
				DescMon: [],
				DescBoss: "BOSS名",
				DescBossLib: "",
				DescBossImage: ""
			},
			cells: [],
			waves: [],
			effects: [],
			carts: [],
			platformGroups: [],        // 移动平台组
			cottonCandyZones: [],      // 棉花糖区域
			cottonCandyHoleGen: {
			    mode: "timed",   // "columnRandom" 或 "timed"
			    interval: 30.0
			},
			timeLimit: {
			    enabled: false,
			    seconds: 60
			}
		};

		this.loadDefaultMap();
		this.updateUI();
		this.selectedCell = null;
		this.updateCellPropertiesUI();
	},
	// 缩放网格
	zoomGrid: function(factor) {
		const gridContainer = document.getElementById('gridContainer');
		const currentTransform = gridContainer.style.transform || 'scale(1)';
		const match = currentTransform.match(/scale\(([\d.]+)\)/);
		const currentScale = match ? parseFloat(match[1]) : 1;
		const newScale = currentScale * factor;

		// 限制缩放范围
		if (newScale < 0.3 || newScale > 3) return;

		gridContainer.style.transform = `scale(${newScale})`;
		gridContainer.style.transformOrigin = 'center center';
	},

	// 居中网格
	centerGrid: function() {
		const mapContainer = document.querySelector('.map-container');
		const gridContainer = document.getElementById('gridContainer');

		mapContainer.scrollTo({
			left: (gridContainer.offsetWidth - mapContainer.clientWidth) / 2,
			top: (gridContainer.offsetHeight - mapContainer.clientHeight) / 2,
			behavior: 'smooth'
		});
	}
};

// 初始化地图编辑器
document.addEventListener('DOMContentLoaded', () => {
	MapEditor.init();

	// 绑定添加预放置按钮
	document.getElementById('addPrePlaceBtn').addEventListener('click', () => {
		if (MapEditor.selectedCell) {
			MapEditor.addPrePlace();
		} else {
			alert("请先选择一个单元格");
		}
	});

	// 绑定清空预放置按钮
	document.getElementById('clearPrePlaceBtn').addEventListener('click', () => {
		if (MapEditor.selectedCell && MapEditor.selectedCell.prePlant && MapEditor.selectedCell.prePlant
			.length > 0) {
			if (confirm("确定要清空所有预放置配置吗？")) {
				MapEditor.selectedCell.prePlant = [];
				MapEditor.updatePrePlaceUI();
			}
		} else {
			alert("没有可清空的预放置配置");
		}
	});
});