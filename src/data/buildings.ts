import { BuildingType, BuildingDefinition, ResourceType, TerrainType } from '../types';

export const BUILDING_DEFINITIONS: Record<BuildingType, BuildingDefinition> = {
  [BuildingType.HOUSE]: {
    type: BuildingType.HOUSE,
    name: '民房',
    icon: '🏠',
    description: '提供人口容量，需要食物和水維持',
    size: { width: 1, height: 1 },
    cost: {
      [ResourceType.WOOD]: 15,
      [ResourceType.STONE]: 8
    },
    produces: {},
    consumes: {
      [ResourceType.FOOD]: 0.5,
      [ResourceType.WATER]: 0.3
    },
    populationEffect: 4,
    requiredTerrain: [TerrainType.GRASS]
  },

  [BuildingType.FARM]: {
    type: BuildingType.FARM,
    name: '農場',
    icon: '🌾',
    description: '生產食物',
    size: { width: 2, height: 2 },
    cost: {
      [ResourceType.WOOD]: 25,
      [ResourceType.STONE]: 3
    },
    produces: {
      [ResourceType.FOOD]: 2.0
    },
    consumes: {
      [ResourceType.WATER]: 0.5
    },
    populationEffect: 0,
    requiredTerrain: [TerrainType.GRASS]
  },

  [BuildingType.LUMBERJACK]: {
    type: BuildingType.LUMBERJACK,
    name: '伐木場',
    icon: '🪓',
    description: '砍伐木材',
    size: { width: 1, height: 1 },
    cost: {
      [ResourceType.WOOD]: 10,
      [ResourceType.STONE]: 3
    },
    produces: {
      [ResourceType.WOOD]: 1.5
    },
    consumes: {},
    populationEffect: 0,
    requiredTerrain: [TerrainType.FOREST]
  },

  [BuildingType.QUARRY]: {
    type: BuildingType.QUARRY,
    name: '採石場',
    icon: '⛏️',
    description: '開採石材',
    size: { width: 2, height: 2 },
    cost: {
      [ResourceType.WOOD]: 20,
      [ResourceType.STONE]: 5
    },
    produces: {
      [ResourceType.STONE]: 1.2
    },
    consumes: {},
    populationEffect: 0,
    requiredTerrain: [TerrainType.STONE_DEPOSIT, TerrainType.MOUNTAIN]
  },

  [BuildingType.MINE]: {
    type: BuildingType.MINE,
    name: '礦場',
    icon: '⚒️',
    description: '開採鐵礦',
    size: { width: 2, height: 2 },
    cost: {
      [ResourceType.WOOD]: 40,
      [ResourceType.STONE]: 20
    },
    produces: {
      [ResourceType.IRON]: 0.8
    },
    consumes: {},
    populationEffect: 0,
    requiredTerrain: [TerrainType.IRON_DEPOSIT],
    unlockRequirement: {
      population: 15
    }
  },

  [BuildingType.WELL]: {
    type: BuildingType.WELL,
    name: '水井',
    icon: '🚰',
    description: '提供水源',
    size: { width: 1, height: 1 },
    cost: {
      [ResourceType.WOOD]: 20,
      [ResourceType.STONE]: 15
    },
    produces: {
      [ResourceType.WATER]: 2.0
    },
    consumes: {},
    populationEffect: 0,
    requiredTerrain: [TerrainType.GRASS]
  },

  [BuildingType.MARKET]: {
    type: BuildingType.MARKET,
    name: '市場',
    icon: '🏪',
    description: '提升資源流通效率',
    size: { width: 2, height: 2 },
    cost: {
      [ResourceType.WOOD]: 50,
      [ResourceType.STONE]: 30,
      [ResourceType.IRON]: 5
    },
    produces: {
      [ResourceType.GOLD]: 1.0
    },
    consumes: {
      [ResourceType.FOOD]: 0.2
    },
    populationEffect: 2,
    requiredTerrain: [TerrainType.GRASS],
    unlockRequirement: {
      population: 35
    }
  },

  [BuildingType.WAREHOUSE]: {
    type: BuildingType.WAREHOUSE,
    name: '倉庫',
    icon: '🏬',
    description: '增加資源儲存容量',
    size: { width: 2, height: 2 },
    cost: {
      [ResourceType.WOOD]: 60,
      [ResourceType.STONE]: 40,
      [ResourceType.IRON]: 8
    },
    produces: {},
    consumes: {},
    populationEffect: 0,
    requiredTerrain: [TerrainType.GRASS],
    unlockRequirement: {
      population: 25
    }
  }
}; 