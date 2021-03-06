// selectors
const boardElement = document.getElementById('board');
const actioncam = document.getElementById('action-cam');

// sounds
const sounds = {
  bg: new Audio('sounds/bg.mp3'),
  loot: new Audio('sounds/loot.mp3'),
  trade: new Audio('sounds/trade.wav'),
  pattack: new Audio('sounds/pattack.wav'),
  mattack: new Audio('sounds/mattack.wav'),
  gold: new Audio('sounds/gold.wav'),
  levelup: new Audio('sounds/levelup.wav'),
  death: new Audio('sounds/death.wav'),
  battle: new Audio('sounds/battle.mp3'),
  win: new Audio('sounds/win.mp3'),
  key: new Audio('sounds/key.wav'),
  potion: new Audio('sounds/potion.wav'),
  bomb: new Audio('sounds/bomb.wav'),
};

// game state. Is used in the keyboard event listener to prevent user action if game is over
let GAME_STATE = 'PLAY';

// init board
// //✓ Code creates a board with 20 rows and 25 columns (can play around to test different sizes) and render it
const board = new Board(20, 25);
board.render(boardElement);

// init player
// //✓ Code creates player at the center of the board with 2 items and render it
const MIDDLE_ROW = Math.floor(board.rows.length / 2);
const MIDDLE_COL = Math.floor(board.rows[0].length / 2);

const ITEM_CLASSES = [Potion, Key, Bomb];
let RandomItem = ITEM_CLASSES[getRandom(0, 2)];

const player = new Player('Player', {
  row: MIDDLE_ROW,
  col: MIDDLE_COL,
});
player.items.push(new RandomItem(getRandom(0, 3)));
player.items.push(new RandomItem(getRandom(0, 3)));
player.render(boardElement);

function playerName() {
  let person = prompt("What's your name, Adventurer?", '');
  if (person == null || person == 'Player') {
    txt = 'User cancelled the prompt.';
  } else {
    player.name = person;
  }
}
playerName();

// Keep this, used to display the information on the box on the right of the board
updateActionCam();

// board entities

// monsters

// //✓Code creates all the monsters entities and sets them on the board at a random position
// //✓Code gives each monster a random name, random level (1-3), a potion (random rarity 0-3), random gold (0-50)
// //✓Give one monster the key
let epicKey;
for (let i = 0; i < MAX_MONSTERS; i++) {
  if (epicKey !== 'assigned') {
    board.setEntity(
      new Monster(
        MONSTER_NAMES[getRandom(0, MONSTER_NAMES.length - 1)],
        getRandom(1, 3),
        [new Potion(getRandom(0, 3)), new Key(3)],
        getRandom(0, 50)
      ),
      getRandomPosition()
    );
    epicKey = 'assigned';
  } else {
    board.setEntity(
      new Monster(
        MONSTER_NAMES[getRandom(0, MONSTER_NAMES.length - 1)],
        getRandom(1, 3),
        [new Potion(getRandom(0, 3))],
        getRandom(0, 50)
      ),
      getRandomPosition()
    );
  }
}

// items
// //✓ Code creates a potion and a bomb entity and sets them at a random board position

board.setEntity(new Potion(getRandom(0, 3)), getRandomPosition());
board.setEntity(new Bomb(getRandom(0, 3)), getRandomPosition());

// gold
// //✓ Code creates a gold entity and place it at a random position on the board

board.setEntity(new Gold(getRandom(10, 50)), getRandomPosition());

// dungeons
// //✓ Code creates an opened dungeon and a closed dungeon you can loot (random position)
// //✓ Code creates a dungeon that is closed and has the puppy (random position)

board.setEntity(
  new Dungeon(true, false, getRandom(0, 50), [
    new Bomb(getRandom(0, 3)),
    new Potion(getRandom(0, 3)),
  ]),
  getRandomPosition()
);
board.setEntity(
  new Dungeon(false, false, getRandom(0, 50), [
    new Bomb(getRandom(0, 3)),
    new Potion(getRandom(0, 3)),
    new Key(3),
  ]),
  getRandomPosition()
);
board.setEntity(
  new Dungeon(false, true, getRandom(0, 50), [
    new Bomb(getRandom(0, 3)),
    new Potion(getRandom(0, 3)),
  ]),
  getRandomPosition()
);

// trader
// //✓ Code creates a trader with a potion of each rarity (0 to 3), bomb of each rarity and a key at a random position

board.setEntity(
  new Trader([
    new Potion(0),
    new Potion(1),
    new Potion(2),
    new Potion(3),
    new Bomb(0),
    new Bomb(1),
    new Bomb(2),
    new Bomb(3),
    new Key(),
  ]),
  getRandomPosition()
);

// event handlers

let monsterAttack;
// This event listener moves the player
// //✓ Add code to check if the entity at the new player position (after move) is a monster. If so, call the encounterMonster function
document.addEventListener('keydown', ev => {
  if (ev.key === 'ArrowLeft') {
    player.move('left');
  }
  if (ev.key === 'ArrowRight') {
    player.move('right');
  }
  if (ev.key === 'ArrowUp') {
    player.move('up');
  }
  if (ev.key === 'ArrowDown') {
    player.move('down');
  }

  clearInterval(monsterAttack); // stops monster attack when player moves

  let isMonster = board.getEntity(player.position);
  if (isMonster instanceof Monster) {
    encounterMonster(isMonster);
  }

  if (!ev.key.includes('Arrow') || GAME_STATE === 'GAME_OVER') return;

  if (sounds.bg.paused) playMusic('bg');

  updateActionCam();
});

// helper functions

// Function returns a random position on the board that is not occupied by an entity (Grass is fine) or the player's initial position (center)
// The parameter is a Board object //] is the parameter needed?
function getRandomPosition(/*board*/) {
  let position = 'unassigned';
  while (position === 'unassigned') {
    let x = getRandom(1, board.rows.length - 1);
    let y = getRandom(1, board.rows[0].length - 1);
    if (
      board.rows[x][y] instanceof Grass === false ||
      board.rows[x][y] === board.rows[MIDDLE_ROW][MIDDLE_COL]
    ) {
      position = 'unassigned';
    } else {
      position = 'assigned';
      return new Position(x, y);
    }
  }
}

// //✓ UPDATE the function passed to setInterval to attack the player and trigger player death if hp is 0 or lower
// //✓ The parameter is a Monster object
// //✓ Replace the interval time of 1000 by the monster attack speed
// //✓ Replace the hp printed to be the player's hp
function encounterMonster(monster) {
  playMusic('battle');
  monsterAttack = setInterval(() => {
    if (player.hp === 0) {
      playerDeath();
    } else {
      monster.attack(player);
    }
    document.getElementById('Player-hp').textContent = `HP: ${player.hp}`;
  }, monster.attackSpeed);
}

// Use when the player is dead, no need to change anything
function playerDeath() {
  clearInterval(monsterAttack);
  boardElement.innerHTML = '<h1>GAME OVER</h1>';
  document.getElementById('player-cam').src = 'imgs/player/dead.png';
  document.getElementById('action-menu').style.display = 'none';
  GAME_STATE = 'GAME_OVER';
  playMusic('death');
}

// //✓UPDATE this function to getExp from monster, loot the monster, and clear the entity (monster) at the player position
function defeatMonster(monster) {
  clearInterval(monsterAttack);
  player.getExp(monster);
  player.loot(monster);
  clearEntity(player.position);
  playMusic('bg');
}

// //✓ This function sets the board entity at position to a grass entity
function clearEntity(position) {
  board.setEntity(new Grass(), position);
}

// DOM manipulation functions

// This function updates the 'action cam' - the box showing the enemy and player info as well as the actions
// It is called after an event happened (e.g. used item) to update the information shown in the action box
// //✓ UPDATE the entity variable to be the entity at the player position
function updateActionCam() {
  const entity = board.getEntity(player.position);
  actioncam.innerHTML = '';
  actioncam.appendChild(createActionView(entity));
  actioncam.appendChild(createActionView(player));
  actioncam.appendChild(createActionMenu(entity));
}

// UPDATE this function based on the comments
// // ✓ Replace the if condition calling createCreatureView to only execute if the entity is a creature
// // ✓ Replace the if condition creating the h4 value element to only execute if the entity has a value
// //✓ Replace the ternary condition setting the img.id to be 'player-cam' if the entity is a Player, 'entity-cam' otherwise
// // ✓ Replace the ternary condition setting the img.src to be 'imgs/player/attack.png' if the entity is a Player, else use the entity's image src
function createActionView(entity) {
  const actionView = document.createElement('div');
  actionView.className = 'action-view';
  const infoWrapper = document.createElement('div');

  const name = document.createElement('h3');
  name.textContent = entity.name || entity.constructor.name;
  infoWrapper.appendChild(name);
  if (entity instanceof Creature) createCreatureView(infoWrapper, entity);
  if (entity.value) {
    //entity.value is truthy or falsey
    const value = document.createElement('h4');
    value.textContent = entity.value;
    // Add code here to set the value text to the entity's value e.g. "Value: 20"
    infoWrapper.appendChild(value);
  }

  const img = document.createElement('img');
  img.id = entity === player ? 'player-cam' : 'entity-cam';
  img.src = entity === player ? 'imgs/player/attack.png' : entity.element.src;
  actionView.appendChild(infoWrapper);
  actionView.appendChild(img);

  return actionView;
}

// //✓ UPDATE this function based on the comments
function createCreatureView(root, creature) {
  const level = document.createElement('h4');
  // // ✓Add code here to set the level text to the creature's level e.g. "Level 1"
  level.textContent = `Level: ${creature.level}`;
  const hp = document.createElement('h4');
  hp.id = creature.constructor.name + '-hp';
  hp.textContent = `HP: ${creature.hp}`;
  // // ✓Add code here to set the hp text to the creature's hp e.g. "HP: 100"
  const gold = document.createElement('h4');
  // // ✓Add code here to set the gold text to the creature's gold e.g. "Gold: 10"
  gold.textContent = `Gold: ${creature.gold}`;
  root.appendChild(hp);
  root.appendChild(level);
  root.appendChild(gold);
}

// //✓ UPDATE this function to create the appropriate menu based on the entity type. Use the createMenu functions (e.g. createPickupMenu)
function createActionMenu(entity) {
  const actionMenu = document.createElement('div');
  actionMenu.id = 'action-menu';
  if (entity instanceof Monster) {
    createMonsterMenu(actionMenu, entity);
  }
  if (entity instanceof Item || entity instanceof Gold) {
    createPickupMenu(actionMenu, entity);
  }
  if (entity instanceof Trader) {
    createTradeMenu(actionMenu, entity);
  }
  if (entity instanceof Dungeon) {
    createDungeonMenu(actionMenu, entity);
  }
  return actionMenu;
}

// //✓ UPDATE the pickupBtn event listener function to pickup the entity
// //✓ Add a call to clearEntity in the listener function to set a Grass entity at the player position
function createPickupMenu(root, entity) {
  const actions = document.createElement('div');
  actions.textContent = 'Actions';
  const pickupBtn = document.createElement('button');
  pickupBtn.textContent = 'Pick up';
  pickupBtn.addEventListener('click', () => {
    player.pickup(entity);
    //player.pickupBtn(entity);
    updateActionCam();
  });

  //updateActionCam();
  actions.appendChild(pickupBtn);
  root.appendChild(actions);
}

// //✓ UPDATE this function to add a call to createItemActions(root, monster) if the player has items
// //✓Update the attackBtn event listener to attack the monster
// //✓ Update the if condition to execute only if the monster hp is 0 or lower. When true, call defeatMonster.
// // ✓ Replace the timeout value (1000) passed to disable the attackBtn to be the player's attack speed
let attackBtn;
function createMonsterMenu(root, monster) {
  if (player.items.length > 0) {
    createItemActions(root, monster);
  }
  const actions = document.createElement('div');
  actions.textContent = 'Actions';
  attackBtn = document.createElement('button');
  attackBtn.textContent = 'Attack';
  attackBtn.addEventListener('click', () => {
    if (monster.hp === 0) {
      defeatMonster(monster);
      updateActionCam();
    } else {
      player.attack(monster);
      attackBtn.disabled = true;
      setTimeout(() => (attackBtn.disabled = false), player.attackSpeed);
      // // ✓ Replace the hp printed to be the monster's hp
      document.getElementById('Monster-hp').textContent = `HP: ${monster.hp}`;
    }
  });
  actions.appendChild(attackBtn);
  root.appendChild(actions);
}

// UPDATE
// // ✓update the forEach call to be on the player's items instead of an empty array
// //✓ update the function passed to forEach to return immediately if the item is a Key (the key is not a valid item in a battle)
// //✓ update the itemBtn event listener to call useItem on the player for potions, useItem on the monster for Bombs.
// //✓ Add a call to defeatMonster if its hp is 0 or lower (defeatMonster(monster);)
function createItemActions(root, monster) {
  const items = document.createElement('div');
  items.textContent = 'Items';
  let noKeyArr = player.items.filter(
    item => item instanceof Potion || item instanceof Bomb
  );
  noKeyArr.forEach(item => {
    const itemBtn = document.createElement('button');
    // //✓ Add code here to set the itemBtn text to the item name
    itemBtn.textContent = item.name;
    itemBtn.addEventListener('click', () => {
      if (item instanceof Potion) {
        player.useItem(item, player);
      }
      if (item instanceof Bomb) {
        player.useItem(item, monster);
      }
      if (monster.hp === 0) {
        defeatMonster(monster);
        updateActionCam();
      }
    });
    items.appendChild(itemBtn);
  });
  root.appendChild(items);
}

// UPDATE
// //✓ update the first forEach call to be on the trader's items instead of an empty array
// //✓update the second forEach call to be on the player's items instead of an empty array
// //✓ Add code to the itemBtn event listener to buy the clicked item
// //✓ Add code to the itemBtn event listener to sell the clicked item
function createTradeMenu(root, Trader) {
  const buyAction = document.createElement('div');
  buyAction.textContent = 'Buy';
  Trader.items.forEach(item => {
    const itemBtn = document.createElement('button');
    // //✓ Add code here to set the item text to the item's name and value e.g. "Common potion - 10G"
    itemBtn.textContent = `${item.name}: ${item.value} Gold`;
    // //✓ Add code here to set itemBtn to disabled if the player does not have enough gold for the item
    if (player.gold < item.value) {
      itemBtn.disabled = true;
    }
    itemBtn.addEventListener('click', () => {
      player.buy(item, Trader);
      updateActionCam();
    });
    buyAction.appendChild(itemBtn);
  });
  const sellAction = document.createElement('div');
  sellAction.textContent = 'Sell';
  player.items.forEach(item => {
    const itemBtn = document.createElement('button');
    // //✓ Add code here to set the item text to the item's name and value e.g. "Common potion - 10G"
    itemBtn.textContent = `${item.name}: ${item.value} Gold`;
    itemBtn.addEventListener('click', () => {
      player.sell(item, Trader);
      updateActionCam();
    });
    sellAction.appendChild(itemBtn);
  });
  root.appendChild(buyAction);
  root.appendChild(sellAction);
}

// UPDATE the function based on the comments
// //✓ Update the condition to create the openBtn only if the dungeon is not open
// //✓ Update the if condition inside the else block to only win the game if the dungeon has the puppy
// //✓ Update the openBtn event listener to use the key item on the dungeon
// //✓ Update the lootBtn event listener to loot the dungeon
function createDungeonMenu(root, dungeon) {
  const actions = document.createElement('div');
  actions.textContent = 'Actions';
  if (dungeon.isOpen === false) {
    const openBtn = document.createElement('button');
    openBtn.textContent = 'Open';
    // //✓Add code to get the key from the player items
    let keyArr = player.items.filter(item => item instanceof Key);
    let key = keyArr[0];

    // //✓If the player does not have a key, set the openBtn to disabled

    if (keyArr.length === 0) {
      openBtn.disabled = true;
    } else if (keyArr.length > 0) {
      openBtn.disabled = false;
    }

    openBtn.addEventListener('click', () => {
      player.useItem(key, dungeon);
      updateActionCam();
    });
    actions.appendChild(openBtn);
    root.appendChild(actions);
  } else {
    if (dungeon.hasPuppy) {
      boardElement.innerHTML =
        '<h1>You saved the puppy! You WIN!</h1><img src="imgs/dungeon/puppy.jpg" width=500/>';
      actioncam.style.display = 'none';
      GAME_STATE = 'GAME_OVER';
      playMusic('win');
    } else {
      const lootBtn = document.createElement('button');
      lootBtn.textContent = 'Loot';
      // //✓ Add code here to check if the dungeon has gold or items, if not set the lootBtn to disabled
      if (dungeon.items.length === 0 && dungeon.gold === 0) {
        lootBtn.disabled = true;
      } else {
        lootBtn.disabled = false;
      }

      lootBtn.addEventListener('click', () => {
        player.loot(dungeon);
        updateActionCam();
      });
      actions.appendChild(lootBtn);
      root.appendChild(actions);
    }
  }
}

// utility functions - no need to change them

// Plays a background music while ensuring no other music is playing at the same time
function playMusic(music) {
  sounds.bg.pause();
  sounds.battle.currentTime = 0;
  sounds.battle.pause();
  sounds[music].play();
}

// Play sound from the start
function playSound(sound) {
  sounds[sound].currentTime = 0;
  sounds[sound].play();
}

// Returns a random integer between min and max (max included)
function getRandom(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// removes an element from the array
function remove(arr, element) {
  arr.splice(arr.indexOf(element), 1);
}
