import { Game } from '../core/Game';
import { GoalTier } from '../types';

export class MenuManager {
  private game: Game;
  private menuContainer: HTMLElement;
  private isVisible: boolean = true;

  constructor(game: Game) {
    this.game = game;
    
    this.menuContainer = this.createMenuContainer();
    
    this.showMenu();
  }

  /**
   * 創建主選單容器
   */
  private createMenuContainer(): HTMLElement {
    const container = document.createElement('div');
    container.id = 'main-menu';
    container.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      z-index: 10000;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      font-family: Arial, sans-serif;
      color: white;
    `;

    container.innerHTML = `
      <div class="menu-content" style="text-align: center; max-width: 600px; padding: 40px;">
        <h1 style="font-size: 3em; margin-bottom: 20px; text-shadow: 2px 2px 4px rgba(0,0,0,0.5);">
          🏗️ 城市建設遊戲
        </h1>
        
        <p style="font-size: 1.2em; margin-bottom: 40px; line-height: 1.6;">
          建設你的夢想城市，管理資源，達成目標！
        </p>

        <div class="menu-buttons" style="display: flex; flex-direction: column; gap: 15px; margin-bottom: 40px;">
          <button id="new-game-btn" class="menu-btn" style="
            padding: 15px 30px;
            font-size: 1.1em;
            background: #27ae60;
            color: white;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.3s ease;
          ">🎮 開始新遊戲</button>
          
          <button id="load-game-btn" class="menu-btn" style="
            padding: 15px 30px;
            font-size: 1.1em;
            background: #3498db;
            color: white;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.3s ease;
          ">📁 載入遊戲</button>
          
          <button id="random-map-btn" class="menu-btn" style="
            padding: 15px 30px;
            font-size: 1.1em;
            background: #9b59b6;
            color: white;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.3s ease;
          ">🎲 隨機地圖</button>
        </div>

        <div class="goal-selection" style="margin-bottom: 30px;">
          <h3 style="margin-bottom: 15px;">選擇目標難度：</h3>
          <div class="goal-buttons" style="display: flex; gap: 10px; justify-content: center;">
            <button class="goal-btn" data-tier="bronze" style="
              padding: 10px 20px;
              background: #cd7f32;
              color: white;
              border: none;
              border-radius: 5px;
              cursor: pointer;
              font-weight: bold;
            ">🥉 銅級</button>
            <button class="goal-btn" data-tier="silver" style="
              padding: 10px 20px;
              background: #c0c0c0;
              color: #333;
              border: none;
              border-radius: 5px;
              cursor: pointer;
              font-weight: bold;
            ">🥈 銀級</button>
            <button class="goal-btn" data-tier="gold" style="
              padding: 10px 20px;
              background: #ffd700;
              color: #333;
              border: none;
              border-radius: 5px;
              cursor: pointer;
              font-weight: bold;
            ">🥇 金級</button>
          </div>
        </div>

        <div class="game-info" style="font-size: 0.9em; opacity: 0.8; line-height: 1.4;">
          <p>🎯 完成目標解鎖獎勵 • ⏱️ 挑戰時間限制 • 🌍 探索隨機地圖</p>
        </div>
      </div>
    `;

    document.body.appendChild(container);
    this.setupMenuEvents(container);
    return container;
  }

  /**
   * 設置選單事件
   */
  private setupMenuEvents(container: HTMLElement): void {
    let selectedTier: GoalTier = GoalTier.BRONZE;

    // 目標難度選擇
    const goalButtons = container.querySelectorAll('.goal-btn');
    goalButtons.forEach(button => {
      button.addEventListener('click', () => {
        goalButtons.forEach(btn => btn.classList.remove('selected'));
        button.classList.add('selected');
        selectedTier = (button as HTMLElement).dataset.tier as GoalTier;
        
        // 更新按鈕樣式
        this.updateGoalButtonStyles(goalButtons, button);
      });
    });

    // 默認選中銅級
    const bronzeBtn = container.querySelector('[data-tier="bronze"]');
    if (bronzeBtn) {
      bronzeBtn.classList.add('selected');
      this.updateGoalButtonStyles(goalButtons, bronzeBtn);
    }

    // 新遊戲按鈕
    const newGameBtn = container.querySelector('#new-game-btn');
    newGameBtn?.addEventListener('click', () => {
      this.startNewGame(selectedTier);
    });

    // 載入遊戲按鈕
    const loadGameBtn = container.querySelector('#load-game-btn') as HTMLButtonElement;
    loadGameBtn?.addEventListener('click', () => {
      this.loadGame();
    });

    // 檢查是否有存檔
    if (!this.game.hasSaveGame()) {
      loadGameBtn.disabled = true;
      loadGameBtn.style.opacity = '0.5';
      loadGameBtn.style.cursor = 'not-allowed';
      loadGameBtn.textContent = '📁 無存檔';
    }

    // 隨機地圖按鈕
    const randomMapBtn = container.querySelector('#random-map-btn');
    randomMapBtn?.addEventListener('click', () => {
      const randomSeed = Math.floor(Math.random() * 1000000);
      this.startNewGame(selectedTier, randomSeed);
    });

    // 按鈕懸停效果
    const menuButtons = container.querySelectorAll('.menu-btn');
    menuButtons.forEach(button => {
      button.addEventListener('mouseenter', () => {
        (button as HTMLElement).style.transform = 'translateY(-2px)';
        (button as HTMLElement).style.boxShadow = '0 4px 8px rgba(0,0,0,0.3)';
      });
      
      button.addEventListener('mouseleave', () => {
        (button as HTMLElement).style.transform = 'translateY(0)';
        (button as HTMLElement).style.boxShadow = 'none';
      });
    });
  }

  /**
   * 更新目標按鈕樣式
   */
  private updateGoalButtonStyles(buttons: NodeListOf<Element>, selectedButton: Element): void {
    buttons.forEach(btn => {
      const htmlBtn = btn as HTMLElement;
      if (btn === selectedButton) {
        htmlBtn.style.border = '3px solid #fff';
        htmlBtn.style.transform = 'scale(1.1)';
      } else {
        htmlBtn.style.border = 'none';
        htmlBtn.style.transform = 'scale(1)';
      }
    });
  }

  /**
   * 開始新遊戲
   */
  private startNewGame(goalTier: GoalTier, mapSeed?: number): void {
    this.game.startNewGame(goalTier, mapSeed);
    this.hideMenu();
    this.game.start();
  }

  /**
   * 載入遊戲
   */
  private loadGame(): void {
    if (this.game.loadGame()) {
      this.hideMenu();
      this.game.start();
    } else {
      alert('載入遊戲失敗！');
    }
  }

  /**
   * 顯示選單
   */
  showMenu(): void {
    if (!this.isVisible) {
      this.menuContainer.style.display = 'flex';
      this.isVisible = true;
    }
  }

  /**
   * 隱藏選單
   */
  hideMenu(): void {
    if (this.isVisible) {
      this.menuContainer.style.display = 'none';
      this.isVisible = false;
    }
  }

  /**
   * 檢查選單是否可見
   */
  isMenuVisible(): boolean {
    return this.isVisible;
  }

  /**
   * 返回主選單
   */
  returnToMenu(): void {
    this.game.returnToMenu();
    this.showMenu();
    
    // 更新載入按鈕狀態
    const loadGameBtn = this.menuContainer.querySelector('#load-game-btn') as HTMLButtonElement;
    if (loadGameBtn) {
      if (this.game.hasSaveGame()) {
        loadGameBtn.disabled = false;
        loadGameBtn.style.opacity = '1';
        loadGameBtn.style.cursor = 'pointer';
        loadGameBtn.textContent = '📁 載入遊戲';
      } else {
        loadGameBtn.disabled = true;
        loadGameBtn.style.opacity = '0.5';
        loadGameBtn.style.cursor = 'not-allowed';
        loadGameBtn.textContent = '📁 無存檔';
      }
    }
  }

  /**
   * 銷毀選單
   */
  destroy(): void {
    if (this.menuContainer.parentNode) {
      this.menuContainer.parentNode.removeChild(this.menuContainer);
    }
  }
} 