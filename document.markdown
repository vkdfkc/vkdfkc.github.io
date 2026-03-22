# Lua API 文档

注意：本文档由生成式AI整理。

本文档整理了游戏引擎暴露给 Lua 的所有 API 接口，包含原始 Pascal 代码中注册的全局表及其方法，以及 Teal 动态添加的辅助函数。

---

## 全局表

### 1. `IScene` – 场景基础接口

| 方法 | 参数 | 返回值 | 说明 |
|------|------|--------|------|
| `getCurrent()` | 无 | `userdata` 或 `nil` | 获取当前激活的场景对象 |
| `open(scene: userdata)` | `scene` – 场景对象 | 无 | 打开指定场景（调用其 `OpenScene` 方法） |
| `close(scene: userdata[, newBgm: integer])` | `scene` – 场景对象<br>`newBgm` – 可选，切换后的背景音乐 ID | 无 | 关闭指定场景（可同时切换背景音乐） |
| `run(scene: userdata, delta: integer)` | `scene` – 场景对象<br>`delta` – 帧间隔（毫秒） | 无 | 更新场景逻辑（通常由引擎循环调用） |
| `changeBgm(scene: userdata, musicId: integer)` | `scene` – 场景对象<br>`musicId` – 新音乐 ID | 无 | 立即切换背景音乐 |
| `setBgm(scene: userdata, musicId: integer)` | `scene` – 场景对象<br>`musicId` – 新音乐 ID | 无 | 设置背景音乐但不立即播放 |
| `getMusicId(scene: userdata)` | `scene` – 场景对象 | `integer` 或 `nil` | 获取当前背景音乐 ID |
| `getSceneType(scene: userdata)` | `scene` – 场景对象 | `integer` 或 `nil` | 获取场景类型枚举值 |
| `getSceneDesc(scene: userdata)` | `scene` – 场景对象 | `string` 或 `nil` | 获取场景描述 |
| `setSceneDesc(scene: userdata, desc: string)` | `scene` – 场景对象<br>`desc` – 新描述 | 无 | 设置场景描述 |
| `getName(scene: userdata)` | `scene` – 场景对象 | `string` 或 `nil` | 获取场景名称 |
| `setName(scene: userdata, name: string)` | `scene` – 场景对象<br>`name` – 新名称 | 无 | 设置场景名称 |
| `getUI(scene: userdata, name: string)` | `scene` – 场景对象<br>`name` – UI 名称 | `userdata` 或 `nil` | 获取场景中指定名称的 UI 对象 |
| `clearUIStatus(scene: userdata)` | `scene` – 场景对象 | 无 | 清除所有 UI 的悬停状态 |
| `clearUIStatusAt(scene: userdata, x: number, y: number)` | `scene` – 场景对象<br>`x`, `y` – 屏幕坐标 | 无 | 清除指定坐标位置的 UI 悬停状态 |
| `click(scene: userdata, x: number, y: number)` | `scene` – 场景对象<br>`x`, `y` – 屏幕坐标 | `boolean` | 模拟点击，返回是否被处理 |
| `keyDown(scene: userdata, key: integer, keyChar: integer, shift: integer)` | `scene` – 场景对象<br>`key` – 虚拟键码<br>`keyChar` – 字符编码<br>`shift` – 修饰键位掩码 | `boolean` | 模拟键盘按下，返回是否被处理 |
| `mouseMove(scene: userdata, shift: integer, x: number, y: number)` | `scene` – 场景对象<br>`shift` – 修饰键位掩码<br>`x`, `y` – 鼠标坐标 | `boolean` | 模拟鼠标移动，返回是否被处理 |
| `mouseDown(scene: userdata, button: integer, shift: integer, x: number, y: number)` | `scene` – 场景对象<br>`button` – 0=左键,1=右键,2=中键<br>`shift` – 修饰键位掩码<br>`x`, `y` – 坐标 | `boolean` | 模拟鼠标按下，返回是否被处理 |
| `mouseUp(scene: userdata, button: integer, shift: integer, x: number, y: number)` | 同上 | `boolean` | 模拟鼠标释放，返回是否被处理 |
| `dblClick(scene: userdata, x: number, y: number)` | `scene` – 场景对象<br>`x`, `y` – 坐标 | `boolean` | 模拟鼠标双击，返回是否被处理 |
| `loadMap(scene: userdata, mapId: string)` | `scene` – 场景对象<br>`mapId` – 地图标识 | `boolean` | 加载指定地图，成功返回 `true` |

---

### 2. `IControl` – 控件基础接口（通用）

| 方法 | 参数 | 返回值 | 说明 |
|------|------|--------|------|
| `getProperty(control: userdata, propName: string)` | `control` – 控件对象<br>`propName` – 属性名 | 任意类型 | 获取控件属性值 |
| `setProperty(control: userdata, propName: string, value: any)` | `control` – 控件对象<br>`propName` – 属性名<br>`value` – 新值 | `boolean` | 设置控件属性，成功返回 `true` |
| `callMethod(control: userdata, methodName: string, ...)` | `control` – 控件对象<br>`methodName` – 方法名<br>后续参数 | 任意类型 | 调用控件方法，返回方法返回值 |

---

### 3. 具体控件表

以下每个表均包含 `create`、`getProperty`、`setProperty`、`callMethod` 四个方法，其中 `create` 返回新创建的控件对象，其他与 `IControl` 相同。

| 表名 | 说明 |
|------|------|
| `IButton` | 按钮控件 |
| `ICheckBox` | 复选框控件 |
| `IEdit2` | 编辑框控件 |
| `IGrid` | 网格控件 |
| `IImage` | 图片控件 |
| `ILevelButton` | 关卡按钮控件 |
| `IProgressbar` | 进度条控件 |
| `IScrollBar` | 滚动条控件 |
| `ISlider` | 滑块控件 |
| `IWindow` | 普通窗口控件 |
| `IModalWindow` | 模态窗口控件 |

---

### 4. `ICell` – 格子对象接口（战场用）

| 方法 | 参数 | 返回值 | 说明 |
|------|------|--------|------|
| `getCellType(cell: userdata)` | `cell` – 格子对象 | `integer` | 获取格子类型（TCellType 枚举） |
| `setCellType(cell: userdata, cellType: integer)` | `cell`, `cellType` | 无 | 设置格子类型 |
| `getWeather(cell: userdata)` | `cell` | `integer` | 获取天气（TCellWeather 枚举） |
| `setWeather(cell: userdata, weather: integer)` | `cell`, `weather` | 无 | 设置天气 |
| `isAvailable(cell: userdata)` | `cell` | `boolean` | 格子是否可用（可种植） |
| `setAvailable(cell: userdata, available: boolean)` | `cell`, `available` | 无 | 设置格子可用状态 |
| `getWidth(cell: userdata)` | `cell` | `number` | 格子宽度 |
| `getHeight(cell: userdata)` | `cell` | `number` | 格子高度 |
| `getCurrX(cell: userdata)` | `cell` | `number` | 当前 X 坐标（屏幕） |
| `getCurrY(cell: userdata)` | `cell` | `number` | 当前 Y 坐标（屏幕） |
| `getPermX(cell: userdata)` | `cell` | `number` | 永久 X 坐标 |
| `getPermY(cell: userdata)` | `cell` | `number` | 永久 Y 坐标 |
| `getCurrCellX(cell: userdata)` | `cell` | `integer` | 当前列索引 |
| `getCurrCellY(cell: userdata)` | `cell` | `integer` | 当前行索引 |
| `getPermCellX(cell: userdata)` | `cell` | `integer` | 永久列索引 |
| `getPermCellY(cell: userdata)` | `cell` | `integer` | 永久行索引 |
| `getVirtualZ(cell: userdata)` | `cell` | `number` | 虚拟 Z 坐标 |
| `setVirtualZ(cell: userdata, z: number)` | `cell`, `z` | 无 | 设置虚拟 Z 坐标 |
| `getPlant(cell: userdata, slot: integer)` | `cell`, `slot` – 槽位（0-6） | `userdata` 或 `nil` | 获取指定槽位的植物对象 |
| `setPlant(cell: userdata, slot: integer, plant: userdata)` | `cell`, `slot`, `plant` | 无 | 将植物放入指定槽位（不检查冲突） |
| `canPlantUnit(cell: userdata, race: integer, typeTag: integer, specialTag: integer)` | `cell`, `race`, `typeTag`, `specialTag` | `boolean`, `specialMark` | 检查是否可以种植指定单位 |
| `plantUnit(cell: userdata, unit: userdata, specialTag: integer)` | `cell`, `unit`, `specialTag` | `boolean` | 种植单位，成功返回 `true` |
| `damageCell(cell: userdata, attacker: userdata, x: number, y: number, containsPlayer: boolean, damage: integer, damageType: integer?)` | `cell`, `attacker`, `x`, `y`, `containsPlayer`, `damage`, `damageType`（可选，默认 `0`） | 无 | 对格子内单位造成伤害 |
| `damageAndRemoveAll(cell: userdata, attacker: userdata, x: number, y: number, containsPlayer: boolean, damage: integer, damageType: integer?)` | 同上 | 无 | 造成伤害并移除所有单位 |
| `shovelPlant(cell: userdata, x: number, y: number)` | `cell`, `x`, `y` | `boolean` | 铲除植物 |
| `hasAnyFriend(cell: userdata)` | `cell` | `boolean` | 格子内是否有友方单位 |
| `getCanAttackPlant(cell: userdata)` | `cell` | `userdata` 或 `nil` | 获取可攻击的植物 |
| `getIgnitePlant(cell: userdata)` | `cell` | `userdata` 或 `nil` | 获取点燃的植物 |
| `makeHole(cell: userdata)` | `cell` | 无 | 制造一个洞（用于生成敌人） |
| `setDestination(cell: userdata, destX: number, destY: number, speed: number?, accel: number?)` | `cell`, `destX`, `destY`, `speed`（默认 2）, `accel`（默认 0.1） | 无 | 设置格子移动目标 |
| `updatePlantPositions(cell: userdata)` | `cell` | 无 | 更新格子内植物的位置 |
| `getCurrentPlantPosition(cell: userdata)` | `cell` | `boolean`, `x`, `y` | 获取当前植物位置（是否成功，坐标） |
| `getBasePlantOffsetX(cell: userdata)` | `cell` | `number` | 获取基础植物 X 偏移 |
| `getBasePlantOffsetY(cell: userdata)` | `cell` | `number` | 获取基础植物 Y 偏移 |
| `reset(cell: userdata)` | `cell` | 无 | 重置格子状态 |

---

### 5. `IBattleFieldScene` – 战场场景接口

| 方法 | 参数 | 返回值 | 说明 |
|------|------|--------|------|
| `getCurrent()` | 无 | `userdata` 或 `nil` | 获取当前战场场景对象 |
| `getCols(scene: userdata)` | `scene` | `integer` | 获取列数 |
| `getRows(scene: userdata)` | `scene` | `integer` | 获取行数 |
| `getCellWidth(scene: userdata)` | `scene` | `integer` | 格子宽度（像素） |
| `getCellHeight(scene: userdata)` | `scene` | `integer` | 格子高度（像素） |
| `getOffsetX(scene: userdata)` | `scene` | `number` | 战场 X 偏移 |
| `getOffsetY(scene: userdata)` | `scene` | `number` | 战场 Y 偏移 |
| `getCurrentFireCount(scene: userdata)` | `scene` | `integer` | 当前火焰计数 |
| `getMaxSunlight(scene: userdata)` | `scene` | `integer` | 最大阳光值 |
| `isGameStarted(scene: userdata)` | `scene` | `boolean` | 游戏是否已开始 |
| `isGamePaused(scene: userdata)` | `scene` | `boolean` | 游戏是否暂停 |
| `pauseGame(scene: userdata[, pause: boolean])` | `scene`<br>`pause` – 可选，强制设置暂停状态 | 无 | 暂停/恢复游戏 |
| `plantPlant(scene: userdata, cellX: integer, cellY: integer, cardIdx: integer)` | `scene`, `cellX`, `cellY`, `cardIdx` | `boolean`, `specialCode`, `plant` | 种植植物（根据卡片索引），返回是否成功、特殊代码和植物对象 |
| `plantPlant(scene: userdata, cellX: integer, cellY: integer, cardIdx: integer[string])` | `scene`, `cellX`, `cellY`, `cardIdx` | `boolean`, `specialCode`, `plant` | 强制种植植物（根据卡片索引，如果cardIdx为字符串，则必须为卡片ID），返回是否成功、特殊代码和植物对象，当cardIdx为数字时，表示从玩家当局游戏携带的卡牌进行种植，当cardIdx为字符串时，表示无视当前玩家懈怠的卡牌，从游戏已被注册的卡牌中进行查找，如果找到，则放置一个0星该卡牌的实例 |
| `generateEnemyAtRow(scene: userdata, enemyId: string, row: integer)` | `scene`, `enemyId`, `row` | `boolean`, `specialCode`, `enemy` | 在指定行生成敌人 |
| `generateEnemyAtCell(scene: userdata, enemyId: string, row: integer, col: integer)` | `scene`, `enemyId`, `row`, `col` | `boolean`, `specialCode`, `enemy` | 在指定格子生成敌人 |
| `generateSunlight(scene: userdata, x: number, y: number, mode: integer?)` | `scene`, `x`, `y`, `mode`（默认 1） | 无 | 生成阳光 |
| `getCellType(scene: userdata, row: integer, col: integer)` | `scene`, `row`, `col` | `integer` | 获取格子类型 |
| `isCellAvailable(scene: userdata, row: integer, col: integer)` | `scene`, `row`, `col` | `boolean` | 格子是否可用 |
| `getCellPlant(scene: userdata, row: integer, col: integer)` | `scene`, `row`, `col` | `userdata` 或 `nil` | 获取格子中的普通植物 |
| `getCellBasePlant(scene: userdata, row: integer, col: integer)` | `scene`, `row`, `col` | `userdata` 或 `nil` | 获取格子中的基础植物 |
| `getCellPlaceHolderEnemy(scene: userdata, row: integer, col: integer)` | `scene`, `row`, `col` | `userdata` 或 `nil` | 获取格子中的占位敌人 |
| `getCellHoleNextSpawnFrame(scene: userdata, row: integer, col: integer)` | `scene`, `row`, `col` | `integer` | 获取格子洞下次生成帧数 |
| `getObjectCount(scene: userdata)` | `scene` | `integer` | 获取所有游戏对象数量 |
| `getObject(scene: userdata, index: integer)` | `scene`, `index` | `userdata` 或 `nil` | 获取指定索引的游戏对象 |
| `getEnemyCount(scene: userdata)` | `scene` | `integer` | 获取敌人数量 |
| `getEnemy(scene: userdata, index: integer)` | `scene`, `index` | `userdata` 或 `nil` | 获取指定索引的敌人 |
| `getAllayCount(scene: userdata)` | `scene` | `integer` | 获取友方单位数量 |
| `getAllay(scene: userdata, index: integer)` | `scene`, `index` | `userdata` 或 `nil` | 获取指定索引的友方单位 |
| `getMiscCount(scene: userdata)` | `scene` | `integer` | 获取杂项对象数量 |
| `getMisc(scene: userdata, index: integer)` | `scene`, `index` | `userdata` 或 `nil` | 获取指定索引的杂项对象 |
| `addForeEffect(scene: userdata, lib: integer, x: number, y: number, frameBase: integer, frameCount: integer, frameEscape: integer)` | `scene`, `lib`, `x`, `y`, `frameBase`, `frameCount`, `frameEscape` | 无 | 添加前景特效 |
| `addBackEffect(scene: userdata, lib: integer, x: number, y: number, frameBase: integer, frameCount: integer, frameEscape: integer)` | 同上 | 无 | 添加背景特效 |
| `incFireCount(scene: userdata, value: integer)` | `scene`, `value` | 无 | 增加火焰计数 |
| `costFireCount(scene: userdata, value: integer)` | `scene`, `value` | `boolean` | 消耗火焰计数，成功返回 `true` |
| `gameFailed(scene: userdata)` | `scene` | 无 | 游戏失败 |
| `collectItem(scene: userdata, itemId: string, count: integer)` | `scene`, `itemId`, `count` | 无 | 收集物品（添加到玩家背包） |
| `itemsSettle(scene: userdata)` | `scene` | 无 | 物品结算 |
| `tryGenerateHole(scene: userdata)` | `scene` | `boolean` | 尝试生成一个洞 |
| `triggerHoleSpawn(scene: userdata)` | `scene` | 无 | 触发洞生成敌人 |
| `getTime(scene: userdata)` | `scene` | `integer` | 获取场景内时间（帧数） |
| `getMapId(scene: userdata)` | `scene` | `string` | 获取地图 ID |
| `getBackToWhich(scene: userdata)` | `scene` | `string` | 获取返回哪个场景标识 |
| `setBackToWhich(scene: userdata, value: string)` | `scene`, `value` | 无 | 设置返回场景标识 |

---

### 6. `game` – 游戏系统接口

| 方法 | 参数 | 返回值 | 说明 |
|------|------|--------|------|
| `dialog(msg: string)` | `msg` | 无 | 显示消息对话框 |
| `logMessage(...)` | 任意数量字符串 | 无 | 向日志写入消息（拼接） |
| `outMessage(text: string, color: integer?)` | `text` – 消息内容<br>`color` – 颜色（默认白色） | 无 | 向聊天板输出消息 |
| `outJsonMsg(...)` | 任意数量字符串 | 无 | 将 JSON 字符串输出到聊天板 |
| `fileExists(path: string)` | `path` | `boolean` | 文件是否存在 |
| `dirExists(path: string)` | `path` | `boolean` | 目录是否存在 |
| `getFileEncoding(path: string)` | `path` | `userdata` | 获取文件编码（返回编码对象） |
| `getObjectIntPtr(obj: userdata)` | `obj` | `integer` | 获取对象指针的整数值 |
| `getPlatform()` | 无 | `string` | 获取平台名称（"windows", "android", "linux", "unknown"） |
| `getExternalStoragePath()` | 无 | `string` | 获取外部存储路径（Android 专有） |
| `listDirectory(path: string)` | `path` | `table` | 列出目录下所有条目（返回数组表） |
| `makeMoveMessage(text: string, x: number?, y: number?, alphaF: number?)` | `text`, `x`（默认 80）, `y`（默认 340）, `alphaF`（默认 1） | 无 | 显示浮动消息 |
| `registerMap(ident: string, json: string)` | `ident` – 地图标识<br>`json` – 地图配置 JSON 字符串 | `boolean` | 注册地图配置 |
| `goBackScene()` | 无 | 无 | 返回上一场景（带特殊逻辑） |
| `getGlobalUI(name: string)` | `name` | `userdata` 或 `nil` | 获取全局 UI 对象 |
| `freeObject(obj: userdata)` | `obj` | 无 | 释放对象内存（谨慎使用） |
| `logJsonMsg(...)` | 任意数量字符串 | 无 | 向日志输出 JSON 字符串 |
| `registerCard(package: string, json: string)` | `package` – 卡片标识<br>`json` – 配置 JSON | `boolean` | 注册卡片 |
| `registerEnemy(package: string, json: string)` | `package` – 敌人标识<br>`json` – 配置 JSON | `boolean` | 注册敌人 |
| `registerRecipe(package: string, json: string)` | `package` – 配方标识<br>`json` – 配置 JSON | `boolean` | 注册配方 |
| `registerVoucher(package: string, json: string)` | `package` – 凭证标识<br>`json` – 配置 JSON | `boolean` | 注册凭证 |
| `registerItem(package: string, json: string)` | `package` – 物品标识<br>`json` – 配置 JSON | `boolean` | 注册物品 |
| `registerMonsterDrop(package: string, mapId: string, json: string)` | `package` – 掉落包标识<br>`mapId` – 地图 ID<br>`json` – JSON 数组 | `boolean` | 注册怪物掉落配置 |
| `registerArmor(package: string, json: string)` | `package` – 装备标识<br>`json` – 配置 JSON | `boolean` | 注册装备 |

**兼容旧版植物/敌人/玩家函数**（推荐使用对应专用表）：

- `createLuaPlant(className, ident)` → 同 `IPlant.createLuaPlant`
- `getPlantProperty(plant, propName)` → 同 `IPlant.getProperty`
- `setPlantProperty(plant, propName, value)` → 同 `IPlant.setProperty`
- `callPlantMethod(plant, methodName, ...)` → 同 `IPlant.callMethod`
- `registerPlantClass(className, table)` → 同 `IPlant.registerClass`
- `unregisterPlantClass(className)` → 同 `IPlant.unregisterClass`
- `getPlantClass(className)` → 同 `IPlant.getClass`
- `createEnemy(className, ident)` → 同 `IEnemy.createLuaEnemy`
- `getEnemyProperty(enemy, propName)` → 同 `IEnemy.getProperty`
- `setEnemyProperty(enemy, propName, value)` → 同 `IEnemy.setProperty`
- `callEnemyMethod(enemy, methodName, ...)` → 同 `IEnemy.callMethod`
- `registerEnemyClass(className, table)` → 同 `IEnemy.registerClass`
- `getEnemyClass(className)` → 同 `IEnemy.getClass`
- `getPlayer()` → 同 `IPlayer.getPlayer`
- `checkCardBagSize(count)` → 同 `IPlayer.checkCardBagSize`
- `giveCard(ident, level, count?)` → 同 `IPlayer.giveCard`
- `getCardName(id)` → 同 `IPlayer.getCardName`
- `getCardInfo(player, index)` → 同 `IPlayer.getCardInfo`
- `setCardLevel(player, index, level)` → 同 `IPlayer.setCardLevel`
- `removeCard(player, index)` → 同 `IPlayer.removeCard`
- `getBagCardProperty(player, index, propName)` → 同 `IPlayer.getBagCardProperty`
- `setBagCardProperty(player, index, propName, value)` → 同 `IPlayer.setBagCardProperty`
- `getBagCardCount(player)` → 同 `IPlayer.getBagCardCount`
- `swapBagCards(player, idx1, idx2)` → 同 `IPlayer.swapBagCards`
- `getItemInfo(player, index)` → 同 `IPlayer.getItemInfo`
- `removeItem(player, index, count)` → 同 `IPlayer.removeItem`

---

### 7. `ISceneManager` – 场景管理器

| 方法 | 参数 | 返回值 | 说明 |
|------|------|--------|------|
| `getCurrentScene()` | 无 | `userdata` 或 `nil` | 获取当前场景对象 |
| `getPreviousScene()` | 无 | `userdata` 或 `nil` | 获取上一个场景对象 |
| `hasPreviousScene()` | 无 | `boolean` | 是否有上一个场景 |
| `goBack()` | 无 | `boolean` | 返回上一个场景，成功返回 `true` |
| `changeToScene(scene: string or userdata)` | `scene` – 场景名称或场景对象 | 无 | 切换到指定场景 |
| `registerSceneClass(className: string, classTable: table)` | `className`, `classTable` | `boolean` | 注册一个 Lua 场景类 |
| `createLuaScene(className: string, sceneName: string)` | `className`, `sceneName` | `userdata` 或 `nil` | 创建 Lua 场景实例 |
| `getScene(name: string)` | `name` | `userdata` 或 `nil` | 通过名称获取场景对象 |

---

### 8. `IUIManager` – UI 管理器

| 方法 | 参数 | 返回值 | 说明 |
|------|------|--------|------|
| `registerUIClass(className: string, classTable: table)` | `className`, `classTable` | `boolean` | 注册一个 Lua UI 类 |
| `createLuaUI(className: string, uiName: string)` | `className`, `uiName` | `userdata` 或 `nil` | 创建 Lua UI 实例 |
| `uiAddControl(ui: userdata, controlType: string, controlName: string, parentName: string?)` | `ui`, `controlType`, `controlName`, `parentName` | `boolean` | 向 Lua UI 添加控件 |
| `uiConfigureControl(ui: userdata, controlName: string, json: string)` | `ui`, `controlName`, `json` | `boolean` | 配置 Lua UI 中的控件属性 |
| `getUIFromScene(scene: userdata, uiName: string)` | `scene`, `uiName` | `userdata` 或 `nil` | 从场景中获取 UI 对象 |
| `getControlFromGameUI(ui: userdata, controlName: string)` | `ui`, `controlName` | `userdata` 或 `nil` | 从 UI 中获取控件对象 |
| `addLuaUIToScene(scene: userdata, ui: userdata, name: string)` | `scene`, `ui`, `name` | `boolean` | 将 Lua UI 添加到场景 |
| `uiSetControlEvent(ui: userdata, controlName: string, eventName: string, func: function)` | `ui`, `controlName`, `eventName`, `func` | `boolean` | 为 Lua UI 中的控件设置事件回调 |
| `uiAddControlToUI(ui: userdata, controlType: string, controlName: string, parentName: string?)` | `ui`, `controlType`, `controlName`, `parentName` | `boolean` | 向普通 UI（非 Lua UI）添加控件 |
| `uiConfigureControlToUI(ui: userdata, controlName: string, json: string)` | `ui`, `controlName`, `json` | `boolean` | 配置普通 UI 中的控件 |
| `uiSetControlEventToUI(ui: userdata, controlName: string, eventName: string, func: function)` | `ui`, `controlName`, `eventName`, `func` | `boolean` | 为普通 UI 中的控件设置事件回调 |

**动态增强函数**（在 Teal 中定义，覆盖部分原始方法）：

- `IUIManager.createLuaUI(className, uiName)` – 原始方法，但会为创建的 UI 对象添加类型标记 `_UI_TYPE[tostring(ui)] = "LuaUI"`，以便后续函数区分。
- `IUIManager.getUIFromScene(scene, uiName)` – 原始方法，但会为获取的普通 UI 添加类型标记 `_UI_TYPE[tostring(ui)] = "BaseUI"`。
- `IUIManager.addControlToUI(ui, controlType, controlName, parentName?)` – 统一添加控件（自动区分 LuaUI 和普通 UI）。
- `IUIManager.configureControl(ui, controlName, config)` – 统一配置控件，`config` 表中可包含属性名-值对，以及事件名-函数对（自动绑定事件）。

---

### 9. `IPlant` – 植物接口

| 方法 | 参数 | 返回值 | 说明 |
|------|------|--------|------|
| `createLuaPlant(className: string, ident: string)` | `className`, `ident` | `userdata` 或 `nil` | 创建 Lua 植物实例 |
| `getProperty(plant: userdata, propName: string)` | `plant`, `propName` | 任意类型 | 获取植物属性（支持 `ident`, `race`, `appr`, `typeTag`, `currentX`, `currentY`, `permentX`, `permentY`, `speedX`, `accelerateX`, `speedY`, `accelerateY`, `responseMouseClick`, `responseMouseMove`, `death`, `level`, `skillLevel`, `positionStatus`, `canStruckDamage`, `healthPoint`, `maxHealthPoint`, `width`, `height`, `luaClassName`, `luaTableRef`） |
| `setProperty(plant: userdata, propName: string, value: any)` | `plant`, `propName`, `value` | 无 | 设置植物属性（仅支持可写属性） |
| `callMethod(plant: userdata, methodName: string, ...)` | `plant`, `methodName`, 参数 | 任意类型 | 调用植物的 RTTI 方法 |
| `registerClass(className: string, classTable: table)` | `className`, `classTable` | `boolean` | 注册 Lua 植物类 |
| `unregisterClass(className: string)` | `className` | 无 | 注销植物类 |
| `getClass(className: string)` | `className` | `table` 或 `nil` | 获取植物类的元表 |

---

### 10. `IEnemy` – 敌人接口

| 方法 | 参数 | 返回值 | 说明 |
|------|------|--------|------|
| `createLuaEnemy(className: string, ident: string)` | `className`, `ident` | `userdata` 或 `nil` | 创建 Lua 敌人实例 |
| `getProperty(enemy: userdata, propName: string)` | `enemy`, `propName` | 任意类型 | 获取敌人属性（与植物类似） |
| `setProperty(enemy: userdata, propName: string, value: any)` | `enemy`, `propName`, `value` | 无 | 设置敌人属性 |
| `callMethod(enemy: userdata, methodName: string, ...)` | `enemy`, `methodName`, 参数 | 任意类型 | 调用敌人的 RTTI 方法 |
| `registerClass(className: string, classTable: table)` | `className`, `classTable` | `boolean` | 注册 Lua 敌人类 |
| `getClass(className: string)` | `className` | `table` 或 `nil` | 获取敌人类的元表 |

---

### 11. `IPlayer` – 玩家接口

| 方法 | 参数 | 返回值 | 说明 |
|------|------|--------|------|
| `getPlayer()` | 无 | `userdata` 或 `nil` | 获取全局玩家对象 |
| `checkCardBagSize(player: userdata, count: integer)` | `player`, `count` | `boolean` | 检查背包空位是否足够 |
| `giveCard(player: userdata, ident: string, level: integer, count: integer?)` | `player`, `ident`, `level`, `count`（默认 1） | 无 | 给予卡片 |
| `getCardName(id: string)` | `id` | `string` | 根据卡片 ID 获取名称 |
| `getCardInfo(player: userdata, index: integer)` | `player`, `index` | `table` 或 `nil` | 获取卡片信息表（包含 `level`, `baseId`, `cost`, `isPlus`, `name`） |
| `setCardLevel(player: userdata, index: integer, level: integer)` | `player`, `index`, `level` | `boolean` | 设置卡片等级 |
| `removeCard(player: userdata, index: integer)` | `player`, `index` | `boolean` | 移除卡片 |
| `getBagCardProperty(player: userdata, index: integer, propName: string)` | `player`, `index`, `propName` | 任意类型 | 获取背包卡片属性（支持 `idx`, `level`, `skillLevel`, `price`, `isColdDown`, `coldDownTime`, `coolDownMaxTime`, `ident`, `baseId`） |
| `setBagCardProperty(player: userdata, index: integer, propName: string, value: any)` | `player`, `index`, `propName`, `value` | `boolean` | 设置背包卡片属性 |
| `getBagCardCount(player: userdata)` | `player` | `integer` | 获取背包容量 |
| `swapBagCards(player: userdata, idx1: integer, idx2: integer)` | `player`, `idx1`, `idx2` | `boolean` | 交换两个卡片位置 |
| `getItemInfo(player: userdata, index: integer)` | `player`, `index` | `table` 或 `nil` | 获取物品信息（含 `ident`, `count`, `param`, `type`, `name`） |
| `removeItem(player: userdata, index: integer, count: integer)` | `player`, `index`, `count` | `boolean` | 移除指定数量的物品 |
| `getLevel([player: userdata])` | `player` 可选，默认全局玩家 | `integer` | 获取玩家等级 |
| `getName([player: userdata])` | 同上 | `string` | 获取玩家名称 |
| `getGameCoin([player: userdata])` | 同上 | `integer` | 获取游戏币数量 |
| `addGameCoin(player: userdata, amount: integer)` | `player`, `amount` | 无 | 增加游戏币 |
| `decGameCoin(player: userdata, amount: integer)` | `player`, `amount` | 无 | 减少游戏币（不检查） |
| `spendGameCoin(player: userdata, amount: integer)` | `player`, `amount` | `boolean` | 消费游戏币（检查足够后扣减） |
| `checkGameCoin(player: userdata, amount: integer)` | `player`, `amount` | `boolean` | 检查游戏币是否足够 |
| `getExp([player: userdata])` | 同上 | `integer` | 获取经验值 |
| `addExp(player: userdata, amount: integer)` | `player`, `amount` | 无 | 增加经验值 |
| `addItem(player: userdata, ident: string, count: integer, hasTimeLimit: boolean?, expireTime: number?)` | `player`, `ident`, `count`, `hasTimeLimit`（默认 false）, `expireTime`（默认 0） | `integer` | 添加物品，返回物品所在索引或 -1 |
| `useItem(player: userdata, index: integer, count: integer?)` | `player`, `index`, `count`（默认 1） | `boolean` | 使用物品 |
| `addEquip(player: userdata, ident: string, count: integer, hasTimeLimit: boolean?, expireTime: number?)` | 同 `addItem` | `integer` | 添加装备 |
| `useEquip(player: userdata, index: integer, count: integer?)` | 同 `useItem` | `boolean` | 使用装备 |
| `moveItem(player: userdata, fromIdx: integer, toIdx: integer)` | `player`, `fromIdx`, `toIdx` | `boolean` | 移动物品 |
| `moveEquip(player: userdata, fromIdx: integer, toIdx: integer)` | `player`, `fromIdx`, `toIdx` | `boolean` | 移动装备 |
| `expandItemBag(player: userdata, addSlots: integer)` | `player`, `addSlots` | `boolean` | 扩展物品背包 |
| `expandEquipBag(player: userdata, addSlots: integer)` | `player`, `addSlots` | `boolean` | 扩展装备背包 |
| `getBagItemUsage([player: userdata])` | `player` 可选 | `number` | 获取物品背包使用率（0-1） |
| `getBagEquipUsage([player: userdata])` | 同上 | `number` | 获取装备背包使用率 |
| `sortItems([player: userdata])` | `player` 可选 | 无 | 排序物品 |
| `sortEquips([player: userdata])` | 同上 | 无 | 排序装备 |
| `clearExpiredItems([player: userdata])` | 同上 | 无 | 清除过期物品 |
| `setCustomData(player: userdata, key: string, value: any)` | `player`, `key`, `value` | 无 | 设置玩家自定义数据 |
| `getCustomData(player: userdata, key: string)` | `player`, `key` | 任意类型 | 获取玩家自定义数据 |
| `removeCustomData(player: userdata, key: string)` | `player`, `key` | 无 | 移除自定义数据 |
| `hasCustomData(player: userdata, key: string)` | `player`, `key` | `boolean` | 是否有自定义数据 |
| `setName(player: userdata, name: string)` | `player`, `name` | 无 | 设置玩家名称 |
| `setLevel(player: userdata, level: integer)` | `player`, `level` | 无 | 设置玩家等级 |
| `getGuildName([player: userdata])` | 同上 | `string` | 获取公会名称 |
| `setGuildName(player: userdata, name: string)` | `player`, `name` | 无 | 设置公会名称 |
| `getAutoPickSunlight([player: userdata])` | 同上 | `boolean` | 是否自动捡阳光 |
| `setAutoPickSunlight(player: userdata, enable: boolean)` | `player`, `enable` | 无 | 设置自动捡阳光 |
| `getAutoPickItem([player: userdata])` | 同上 | `boolean` | 是否自动捡物品 |
| `setAutoPickItem(player: userdata, enable: boolean)` | `player`, `enable` | 无 | 设置自动捡物品 |
| `getShovelType([player: userdata])` | 同上 | `integer` | 获取铲子类型 |
| `setShovelType(player: userdata, shovelType: integer)` | `player`, `shovelType` | 无 | 设置铲子类型 |
| `getIsVIP([player: userdata])` | 同上 | `boolean` | 是否为 VIP |
| `setIsVIP(player: userdata, isVip: boolean)` | `player`, `isVip` | 无 | 设置 VIP 状态 |
| `getVIPLevel([player: userdata])` | 同上 | `integer` | 获取 VIP 等级 |
| `setVIPLevel(player: userdata, level: integer)` | `player`, `level` | 无 | 设置 VIP 等级 |
| `getHealthPoint([player: userdata])` | 同上 | `integer` | 获取生命值 |
| `setHealthPoint(player: userdata, hp: integer)` | `player`, `hp` | 无 | 设置生命值 |
| `getIsWoman([player: userdata])` | 同上 | `boolean` | 是否为女性 |
| `getFeatureValue(player: userdata, part: string)` | `player`, `part` – 部件名（如 `"weapon"`, `"hat"` 等） | `integer` | 获取外观特征值 |
| `setFeatureValue(player: userdata, part: string, value: integer)` | `player`, `part`, `value` | 无 | 设置外观特征值 |

---

### 12. `IResourceManager` – 资源管理器

| 方法 | 参数 | 返回值 | 说明 |
|------|------|--------|------|
| `registerRez(guid: string, modId: string, fileName: string, verifySig: boolean?)` | `guid`, `modId`, `fileName`, `verifySig`（默认 false） | `boolean` | 注册动态资源包 |
| `verifyRez(guid: string)` | `guid` | `boolean` | 验证动态资源包完整性 |
| `unregisterRez(guid: string)` | `guid` | `boolean` | 注销动态资源包 |
| `getResourcePack(guid: string)` | `guid` | `userdata` 或 `nil` | 获取资源包对象 |
| `listDynamicRez()` | 无 | `table` | 返回所有动态资源包 GUID 列表（数组） |
| `updateModPaths()` | 无 | 无 | 更新 Mod 路径映射 |

---

### 13. `IGameUI` – 普通 UI 控件

| 方法 | 参数 | 返回值 | 说明 |
|------|------|--------|------|
| `create()` | 无 | `userdata` | 创建普通 UI 实例 |
| `getProperty(ui: userdata, propName: string)` | `ui`, `propName` | 任意类型 | 获取 UI 属性 |
| `setProperty(ui: userdata, propName: string, value: any)` | `ui`, `propName`, `value` | `boolean` | 设置 UI 属性 |
| `callMethod(ui: userdata, methodName: string, ...)` | `ui`, `methodName`, 参数 | 任意类型 | 调用 UI 方法 |

---

## 动态添加的辅助函数（Teal 运行时）

```lua
-- 向聊天板输出带前缀的消息
game.outModMessage = function(text: string, color: integer)
    game.outMessage('[ModLoaderNeo]: ' .. text, color)
end

-- 四舍五入（Lua 标准库没有）
math.round = function (num: double)
    if num >= 0 then
        return math.floor(num + 0.5)
    else
        return math.ceil(num - 0.5)
    end
end

-- 保存原始函数引用
IUIManager.createLuaUI_raw = IUIManager.createLuaUI
-- 重写 createLuaUI，为创建的 Lua UI 添加类型标记
IUIManager.createLuaUI = function(className: string, uiName: string)
    local ui = IUIManager.createLuaUI_raw(className, uiName)
    if ui then
        _UI_TYPE = _UI_TYPE or {}
        _UI_TYPE[tostring(ui)] = "LuaUI"
    end
    return ui
end

IUIManager.getUIFromScene_raw = IUIManager.getUIFromScene
-- 重写 getUIFromScene，为获取的普通 UI 添加类型标记
IUIManager.getUIFromScene = function(scene: any, uiName: string)
    local ui = IUIManager.getUIFromScene_raw(scene, uiName)
    if ui and not _UI_TYPE[tostring(ui)] then
        _UI_TYPE[tostring(ui)] = "BaseUI"
    end
    return ui
end

-- 统一添加控件（自动识别 UI 类型）
function IUIManager.addControlToUI(ui: any, controlType: string, controlName: string, parentName: string)
    parentName = parentName or ""
    local uiType = _UI_TYPE[tostring(ui)]
    if uiType == "LuaUI" then
        return IUIManager.uiAddControl(ui, controlType, controlName, parentName)
    else
        return IUIManager.uiAddControlToUI(ui, controlType, controlName, parentName)
    end
end

-- 统一配置控件（支持属性与事件）
function IUIManager.configureControl(ui: any, controlName: string, config: record)
    local data = {}
    for k, v in pairs(config) do
        if type(v) == 'function' then
            local uiType = _UI_TYPE[tostring(ui)]
            if uiType == "LuaUI" then
                IUIManager.uiSetControlEvent(ui, controlName, k, v)
            else
                IUIManager.uiSetControlEventToUI(ui, controlName, k, v)
            end
        else
            data[k] = v
        end
    end
    if next(data) then
        local json = require("json")
        local jsonStr = json.encode(data)
        local uiType = _UI_TYPE[tostring(ui)]
        if uiType == "LuaUI" then
            IUIManager.uiConfigureControl(ui, controlName, jsonStr)
        else
            IUIManager.uiConfigureControlToUI(ui, controlName, jsonStr)
        end
    end
end
```

---

## 附录：常用枚举值说明

### 修饰键掩码 `TShiftState` 位定义（与 Delphi 一致）

- 0x01 = ssShift
- 0x02 = ssAlt
- 0x04 = ssCtrl
- 0x08 = ssLeft
- 0x10 = ssRight
- 0x20 = ssMiddle
- 0x40 = ssDouble
- 0x80 = ssTouch
- 0x100 = ssPen
- 0x200 = ssCommand

### 鼠标按钮 `TMouseButton`

- 0 = mbLeft
- 1 = mbRight
- 2 = mbMiddle

### 伤害类型 `TDamageType`

- 0 = dtNormal
- 其他由游戏定义。

### 格子类型 `TCellType`

需参考游戏内部定义。

### 格子天气 `TCellWeather`

需参考游戏内部定义。

### 植物/敌人槽位 `PLANT_SLOT_*`（`ICell.getPlant` / `setPlant` 使用）

- 0 = 玩家
- 1 = 天空植物
- 2 = 保护植物
- 3 = 普通植物
- 4 = 花盆植物
- 5 = 基础植物
- 6 = 占位敌人

---

*本文档根据源码和动态脚本整理，具体行为以实际游戏运行为准。*

Skyline Engine 2019 - 2026 vkdfkc.