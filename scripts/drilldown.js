const ITEM_STR_REGEX = /^\s*(\d+(?:\.\d+)?)\s+(.+)\s*$/;

class ItemRequirement {
  static Parse(str) {
    if (typeof str !== 'string') {
      throw new Error('Expected str');
    }
    const matches = ITEM_STR_REGEX.exec(str);
    if (matches === null) {
      throw new Error('invalid format of item string > ' + str);
    }
    return new ItemRequirement(parseFloat(matches[1]), matches[2]);
  }
  constructor(count, name) {
    this.count = count;
    this.name = name;
  }
  toString() {
    return `${this.count} ${this.name}`
  }
}

class Recipe {
  static Parse(game, obj) {
    if (typeof obj !== 'object') {
      throw new Error('Expected object');
    }
    const result = new Recipe();
    if (obj.in) {
      for (let j in obj.in) {
        const itemReq = ItemRequirement.Parse(obj.in[j]);
        result.in[j] = itemReq;
        game._foundItem(itemReq.name);
      }
    }
    if (obj.out) {
      for (let j in obj.out) {
        const itemReq = ItemRequirement.Parse(obj.out[j]);
        result.out[j] = itemReq;
        game._foundItem(itemReq.name);
      }
    }
    if (obj.power_in) result.powerIn = obj.power_in;
    if (obj.power_out) result.powerOut = obj.power_out;
    if (obj.time >= 0) result.time = obj.time;
    return result;
  }
  constructor() {
    this.time = null;
    this.in = [];
    this.out = [];
  }

  hasInputs() {
    return this.in.length > 0;
  }

  hasOutputs() {
    return this.out.length > 0;
  }
  getInputsPerMinute() {
    let rates = {};
    for (let i in this.in) {
      rates[this.in[i].name] = this.in[i].count * 60 / this.time;
    }
    return rates;
  }
  getOutputsPerMinute() {
    let rates = {};
    for (let i in this.out) {
      const rate = this.out[i].count * 60 / this.time;
      if (rate === 0) {
        debugger;
      }
      rates[this.out[i].name] = rate;
    }
    return rates;
  }
}

class Building {
  static Parse(game, name, obj) {
    if (typeof obj !== 'object') {
      throw new Error('Expected object');
    }
    const result = new Building(name);
    for (let i in obj.build) {
      const itemReq = ItemRequirement.Parse(obj.build[i]);
      result.build.push(itemReq);
      game._foundItem(itemReq.name);
    }
    for (let i in obj.recipes) {
      let recipe = Recipe.Parse(game, obj.recipes[i]);
      result.recipes.push(recipe);
    }
    return result;
  }
  constructor(name) {
    this.name = name;
    this.build = [];
    this.recipes = [];
  }
  getRecipeThatProducesItem(itemName) {
    for (let i in this.recipes) {
      if (this.recipes[i].hasOutputs()) {
        for (let j in this.recipes[i].out) {
          if (this.recipes[i].out[j].name === itemName) {
            return this.recipes[i];
          }
        }
      }
    }
  }
  producesItem(itemName) {
    for (let i in this.recipes) {
      if (this.recipes[i].hasOutputs()) {
        for (let j in this.recipes[i].out) {
          if (this.recipes[i].out[j].name === itemName) {
            return true;
          }
        }
      }
    }
    return false;
  }
  toString() {
    return `${this.name}`
  }
}

class Game {
  static Parse(obj) {
    const game = new Game();

    for (let name in obj.items) {
      game.items[name] = {};
    }

    for (let name in obj.buildings) {
      game.buildings[name] = Building.Parse(game, name, obj.buildings[name]);
    }
    console.log(game);

    return game;
  }
  _foundItem(itemName) {
    if (this.items[itemName] === undefined) {
      console.log('found new item');
      debugger;
      this.items[itemName] = {};
    }
  }
  constructor() {
    this.items = {};
    this.buildings = {};
    this.research = {};
  }
  getMainProducerOfItem(itemName) {
    if (this.items[itemName] && this.items[itemName].main_producer) {
      const buildingName = this.items[itemName].main_producer;
      return this.buildings[buildingName];
    }
    for (let i in this.buildings) {
      const building = this.buildings[i];
      if (building.producesItem(itemName)) {
        return building;
      }
    }
    // Every item needs to have a producer.
    debugger;
    return undefined;
  }
  getAllProducersOfItem(itemName) {
    const producers = [];
    if (this.items[itemName] && this.items[itemName].main_producer) {
      const buildingName = this.items[itemName].main_producer;
      producers.push(this.buildings[buildingName]);
    }
    for (let i in this.buildings) {
      const building = this.buildings[i];
      if (building.producesItem(itemName)) {
        if (!producers.includes(building)) {
          producers.push(building);
        }
      }
    }
    return producers;
  }
}
