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

  // obstacleAt(position, size) {
  //   if (!(position instanceof Vector && size instanceof Vector)) {
  //       throw new Error('Можно передавать только объекты типа Actor');
  //   }

  // }

  obstacleAt(position, size) { //определяет, нет ли препятствия в указанном месте.
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

  removeActor(){

  }

}
