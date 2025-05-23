import { GameGoal, GoalTier, ResourceType, BuildingType } from '../types';

export const GAME_GOALS: Record<GoalTier, GameGoal[]> = {
  [GoalTier.BRONZE]: [
    {
      id: 'bronze_1',
      tier: GoalTier.BRONZE,
      title: '初始聚落',
      description: '建立基本的生存設施',
      requirements: {
        population: 10,
        buildings: {
          [BuildingType.HOUSE]: 2,
          [BuildingType.FARM]: 1,
          [BuildingType.WELL]: 1
        }
      },
      reward: {
        [ResourceType.WOOD]: 50,
        [ResourceType.STONE]: 30
      },
      completed: false
    },
    {
      id: 'bronze_2',
      tier: GoalTier.BRONZE,
      title: '資源收集者',
      description: '收集足夠的基礎資源',
      requirements: {
        resources: {
          [ResourceType.WOOD]: 100,
          [ResourceType.FOOD]: 80,
          [ResourceType.STONE]: 60,
          [ResourceType.WATER]: 50
        }
      },
      reward: {
        [ResourceType.GOLD]: 20
      },
      completed: false
    },
    {
      id: 'bronze_3',
      tier: GoalTier.BRONZE,
      title: '快速發展',
      description: '在30分鐘內達到人口20',
      requirements: {
        population: 20,
        timeLimit: 1800 // 30分鐘
      },
      reward: {
        [ResourceType.WOOD]: 100,
        [ResourceType.STONE]: 100
      },
      completed: false
    }
  ],

  [GoalTier.SILVER]: [
    {
      id: 'silver_1',
      tier: GoalTier.SILVER,
      title: '工業革命',
      description: '解鎖並建設工業建築',
      requirements: {
        population: 50,
        buildings: {
          [BuildingType.LUMBERJACK]: 2,
          [BuildingType.QUARRY]: 1,
          [BuildingType.MINE]: 1
        }
      },
      reward: {
        [ResourceType.IRON]: 50,
        [ResourceType.GOLD]: 50
      },
      completed: false
    },
    {
      id: 'silver_2',
      tier: GoalTier.SILVER,
      title: '貿易大亨',
      description: '建立商業網絡',
      requirements: {
        buildings: {
          [BuildingType.MARKET]: 2,
          [BuildingType.WAREHOUSE]: 1
        },
        resources: {
          [ResourceType.GOLD]: 200
        }
      },
      reward: {
        [ResourceType.GOLD]: 100
      },
      completed: false
    },
    {
      id: 'silver_3',
      tier: GoalTier.SILVER,
      title: '效率專家',
      description: '在45分鐘內完成所有銅級目標',
      requirements: {
        population: 50,
        timeLimit: 2700 // 45分鐘
      },
      reward: {
        [ResourceType.GOLD]: 150
      },
      completed: false
    }
  ],

  [GoalTier.GOLD]: [
    {
      id: 'gold_1',
      tier: GoalTier.GOLD,
      title: '繁榮都市',
      description: '建設一個大型城市',
      requirements: {
        population: 100,
        buildings: {
          [BuildingType.HOUSE]: 10,
          [BuildingType.MARKET]: 3,
          [BuildingType.WAREHOUSE]: 2
        }
      },
      reward: {
        [ResourceType.GOLD]: 500
      },
      completed: false
    },
    {
      id: 'gold_2',
      tier: GoalTier.GOLD,
      title: '資源帝國',
      description: '累積大量資源',
      requirements: {
        resources: {
          [ResourceType.WOOD]: 1000,
          [ResourceType.FOOD]: 800,
          [ResourceType.STONE]: 600,
          [ResourceType.IRON]: 400,
          [ResourceType.GOLD]: 300,
          [ResourceType.WATER]: 500
        }
      },
      reward: {
        [ResourceType.GOLD]: 1000
      },
      completed: false
    },
    {
      id: 'gold_3',
      tier: GoalTier.GOLD,
      title: '速度之王',
      description: '在60分鐘內完成所有目標',
      requirements: {
        population: 100,
        timeLimit: 3600 // 60分鐘
      },
      reward: {
        [ResourceType.GOLD]: 2000
      },
      completed: false
    }
  ]
};

// 獲取當前等級的目標
export function getGoalsForTier(tier: GoalTier): GameGoal[] {
  return GAME_GOALS[tier].map(goal => ({ ...goal })); // 深拷貝
}

// 獲取所有目標
export function getAllGoals(): GameGoal[] {
  const allGoals: GameGoal[] = [];
  Object.values(GoalTier).forEach(tier => {
    allGoals.push(...getGoalsForTier(tier));
  });
  return allGoals;
}

// 檢查目標是否完成
export function checkGoalCompletion(goal: GameGoal, gameState: any): boolean {
  const { requirements } = goal;
  
  // 檢查人口要求
  if (requirements.population && gameState.population.current < requirements.population) {
    return false;
  }
  
  // 檢查資源要求
  if (requirements.resources) {
    for (const [resourceType, amount] of Object.entries(requirements.resources)) {
      if (gameState.resources[resourceType] < amount) {
        return false;
      }
    }
  }
  
  // 檢查建築要求
  if (requirements.buildings) {
    const buildingCounts: { [key: string]: number } = {};
    gameState.buildings.forEach((building: any) => {
      buildingCounts[building.type] = (buildingCounts[building.type] || 0) + 1;
    });
    
    for (const [buildingType, requiredCount] of Object.entries(requirements.buildings)) {
      if ((buildingCounts[buildingType] || 0) < requiredCount) {
        return false;
      }
    }
  }
  
  // 檢查時間限制
  if (requirements.timeLimit) {
    const elapsedSeconds = gameState.gameTime.elapsedTime / 1000;
    if (elapsedSeconds > requirements.timeLimit) {
      return false;
    }
  }
  
  return true;
} 