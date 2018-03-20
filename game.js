'use strict';
// Реализовать базовые классы игры: Vector, Actor и Level.
//Базовый класс игры: Vector
class Vector {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }
  plus(vector) {
    if (!(vector instanceof Vector)) {
      throw new Error('Можно прибавлять к вектору только вектор типа Vector');
    }
    return new Vector(this.x + vector.x, this.y + vector.y);
  }

  times(factor) {
    return new Vector(this.x * factor, this.y * factor);
  }
}


//Базовый класс игры: Actor
class Actor {
  constructor(pos = new Vector(0,0), size = new Vector(1,1), speed = new Vector(0,0)){
    if(!(pos instanceof Vector  && size instanceof Vector && speed instanceof Vector)){
      throw new Error('Можно передавать только объекты типа Vector');
    }
    this.pos = pos;
    this.size = size;
    this.speed = speed;
  }

  act() { }
  get type() {
    return 'actor';
  }
  get left() {
    return this.pos.x;
  }
  get right() {
    return this.pos.x + this.size.x;
  }
  get top() {
    return this.pos.y;
  }
  get bottom() {
    return this.pos.y + this.size.y;
  }

  isIntersect(actor) {
     if(!(actor instanceof Actor)){
      throw new Error('Можно передавать только объекты типа Actor');
     }


     if(actor === this){
      return false;
     }
     return this.right > actor.left && this.left < actor.right && this.bottom > actor.top && this.top < actor.bottom;
    }
}



//Базовый класс игры: Level
class Level {
  constructor(grid = [], actors = []) {
    this.grid = grid.slice();
    this.actors = actors.slice();
    this.player = this.actors.find(x => x.type === 'player' );
    this.height = this.grid.length;
    this.width = Math.max(0, ...this.grid.map(x => x.length));
    this.status = null;
    this.finishDelay = 1;
  }

   isFinished() {
    if(this.status !== null && this.finishDelay < 0){
       return true;
    }
    return false;
  }


  actorAt(actor) {
    if (!(actor instanceof Actor) || actor === undefined) {
      throw new Error('Можно передавать только объекты типа Actor и аргумент не может быть пустым');
    }
    return this.actors.find((curActor) => actor.isIntersect(curActor));
  }

  obstacleAt(position, size) {
    if (!(position instanceof Vector && size instanceof Vector)) {
      throw new Error(`Можно передавать только объекты типа Vector`);
    }

    const borderLeft = Math.floor(position.x);
    const borderRight = Math.ceil(position.x + size.x);
    const borderTop = Math.floor(position.y);
    const borderBottom = Math.ceil(position.y + size.y);

    if (borderLeft < 0 || borderRight > this.width || borderTop < 0) {
      return 'wall';
    }
    if (borderBottom > this.height) {
      return 'lava';
    }

    for (let y = borderTop; y < borderBottom; y++) {
      for (let x = borderLeft; x < borderRight; x++) {
        const gridLevel = this.grid[y][x];
        if (gridLevel) {
          return gridLevel;
        }
      }
    }
  }

//Метод removeActor удаляет переданный объект с игрового поля.
  removeActor(actor) {
      const index = this.actors.indexOf(actor);
    if(index !== -1) {
      this.actors.splice(index, 1);
    }
  }


// Определяет, остались ли еще объекты переданного типа на игровом поле.
  noMoreActors(type) {
    return !this.actors.some((actor) => actor.type === type);
  }


//Метод playerTouched Меняет состояние игрового поля при касании игроком каких-либо объектов или препятствий.
  playerTouched(obstacle, touched) {
    if (this.status !== null) {
      return;
    }

    if(obstacle === 'lava' || obstacle === 'fireball') {
      this.status = 'lost';
    }

    if(obstacle === 'coin') {
      this.removeActor(touched);
      if(this.noMoreActors('coin')) {
        this.status = 'won';
      }
    }
  }
}
 // Парсер уровня

class LevelParser {
  constructor(dictionaryObjects) {
    this.dictionaryObjects = dictionaryObjects;
  }

  actorFromSymbol(symbolString = undefined) {
    if(this.dictionaryObjects !== undefined) {
      return this.dictionaryObjects[symbolString];
    }
  }

  obstacleFromSymbol(symbolString = undefined) {
    if(symbolString ==='x') {
      return 'wall';
    }
    if(symbolString === '!') {
      return 'lava';
    }
  }

  createGrid(symbolString = []) {
    return symbolString.map(row => row.split('').map(symbol => this.obstacleFromSymbol(symbol)));
  }

  createActors(arr) {
    const actors = [];
    for (let i = 0; i < arr.length; i++) {
      for (let j = 0; j < arr[i].length; j++) {
        const actor = this.actorFromSymbol(arr[i].charAt(j));
        if (typeof actor === 'function') {
          const instance = new actor(new Vector(j, i));
          if (instance instanceof Actor) {
            actors.push(instance);
          }
        }
      }
    }
    return actors;
  }

  parse(arr) {
   return new Level(this.createGrid(arr), this.createActors(arr));
  }
}

class Fireball extends Actor {
  constructor(pos = new Vector(0,0), speed = new Vector(0,0)) {
    super(pos, new Vector(1,1), speed);
  }

  get type() {
    return 'fireball';
  }

  getNextPosition(time = 1) {
    return this.pos.plus(this.speed.times(time));
  }

  handleObstacle() {
    this.speed = this.speed.times(-1);
  }

  act(time, playingField) {
    const nextPosition = this.getNextPosition(time);
    if(playingField.obstacleAt(nextPosition, this.size)) {
      this.handleObstacle();
    } else {
      this.pos = nextPosition;
    }
  }
}

class HorizontalFireball extends Fireball {
  constructor(pos) {
    super(pos, new Vector(2,0));
  }
}

class VerticalFireball extends Fireball {
  constructor(pos) {
    super(pos, new Vector(0, 2));
  }
}

class FireRain extends Fireball {
  constructor(pos) {
    super(pos, new Vector(0, 3));
    this.initialPos = this.pos;
  }

  handleObstacle() {
    this.pos = this.initialPos;
  }
}

class Coin extends Actor {
  constructor(pos = new Vector(0, 0)) {
    super(pos.plus(new Vector(0.2, 0.1)), new Vector(0.6, 0.6));
    this.initialPos = this.pos;
    this.springSpeed = 8;
    this.springDist = 0.07;
    this.spring = Math.random() * Math.PI * 2;
  }

  get type() {
    return 'coin';
  }

  updateSpring(time = 1) {
    this.spring = this.spring + this.springSpeed * time;
  }

  getSpringVector() {
    return new Vector(0, Math.sin(this.spring) * this.springDist);
  }

  getNextPosition(time = 1) {
    this.spring += this.springSpeed * time;
    return this.initialPos.plus(this.getSpringVector());
  }

  act(time) {
    this.pos = this.getNextPosition(time);
  }
}

class Player extends Actor {
  constructor(pos = new Vector(0, 0)) {
    super(pos.plus(new Vector(0, -0.5)), new Vector(0.8, 1.5));
  }

  get type() {
    return 'player';
  }
}

const actorDict = {
    '@': Player,
    'v': FireRain,
    'o': Coin,
    '=': HorizontalFireball,
    '|': VerticalFireball
}

const parser = new LevelParser(actorDict);

loadLevels().then(levelsStr => {
  const levels = JSON.parse(levelsStr);
  return runGame(levels, parser, DOMDisplay);
}).then(() => {
  alert('Победа!!!')
});
