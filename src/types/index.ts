// 基本資源類型
export interface ResourceAmount {
  [resourceType: string]: number;
}

// 資源類型枚舉
export enum ResourceType {
  WOOD = 'wood',
  FOOD = 'food',
  STONE = 'stone',
  IRON = 'iron',
  GOLD = 'gold',
  WATER = 'water',
  POPULATION = 'population'
}

// 地形類型
export enum TerrainType {
  GRASS = 'grass',
  WATER = 'water',
  MOUNTAIN = 'mountain',
  FOREST = 'forest',
  STONE_DEPOSIT = 'stone_deposit',
  IRON_DEPOSIT = 'iron_deposit'
}

// 建築類型
export enum BuildingType {
  HOUSE = 'house',
  FARM = 'farm',
  LUMBERJACK = 'lumberjack',
  QUARRY = 'quarry',
  MINE = 'mine',
  WELL = 'well',
  MARKET = 'market',
  WAREHOUSE = 'warehouse'
}

// 建築狀態
export enum BuildingStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  UNDER_CONSTRUCTION = 'under_construction'
}

// 遊戲狀態枚舉
export enum GameMode {
  MENU = 'menu',
  PLAYING = 'playing',
  PAUSED = 'paused',
  COMPLETED = 'completed'
}

// 目標等級
export enum GoalTier {
  BRONZE = 'bronze',
  SILVER = 'silver',
  GOLD = 'gold'
}

// 座標介面
export interface Position {
  x: number;
  y: number;
}

// 地圖格子介面
export interface MapTile {
  position: Position;
  terrain: TerrainType;
  building?: BuildingInstance;
  isOccupied: boolean;
}

// 建築定義介面
export interface BuildingDefinition {
  type: BuildingType;
  name: string;
  icon: string;
  description: string;
  size: { width: number; height: number };
  cost: ResourceAmount;
  produces: ResourceAmount;
  consumes: ResourceAmount;
  populationEffect: number;
  requiredTerrain?: TerrainType[];
  unlockRequirement?: {
    population?: number;
    buildings?: { [type: string]: number };
  };
}

// 建築實例介面
export interface BuildingInstance {
  id: string;
  type: BuildingType;
  position: Position;
  status: BuildingStatus;
  level: number;
  lastProductionTime: number;
  storage: ResourceAmount;
}

// 遊戲目標介面
export interface GameGoal {
  id: string;
  tier: GoalTier;
  title: string;
  description: string;
  requirements: {
    population?: number;
    resources?: ResourceAmount;
    buildings?: { [type: string]: number };
    timeLimit?: number; // 秒
  };
  reward?: ResourceAmount;
  completed: boolean;
}

// 時間信息介面
export interface GameTime {
  startTime: number;
  currentTime: number;
  elapsedTime: number;
  isPaused: boolean;
  pausedTime?: number; // 暫停開始時間
}

// 遊戲狀態介面
export interface GameState {
  mode: GameMode;
  resources: ResourceAmount;
  population: {
    current: number;
    capacity: number;
    growth: number;
  };
  buildings: BuildingInstance[];
  map: MapTile[][];
  gameTime: GameTime;
  goals: GameGoal[];
  selectedBuildingType?: BuildingType;
  currentGoalTier: GoalTier;
  mapSeed: number;
}

// 事件介面
export interface GameEvent {
  type: string;
  data: any;
  timestamp: number;
}

// 主選單選項
export interface MenuOption {
  id: string;
  label: string;
  description?: string;
  action: () => void;
} 