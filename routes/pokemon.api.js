const fs = require("fs");
const express = require("express");
const { faker } = require("@faker-js/faker");
const router = express.Router();

/**
 * params: /
 * description: get all pokemons
 * query:
 * method: get
 */
router.get("/", (req, res, next) => {
  const allowedFilter = ["type", "search", "page", "limit"];
  try {
    let { page, limit, ...filterQuery } = req.query;
    page = parseInt(page) || 1;
    limit = parseInt(limit) || 10;

    //allow title,limit and page query string only
    const filterKeys = Object.keys(filterQuery);
    filterKeys.forEach((key) => {
      if (!allowedFilter.includes(key)) {
        const exception = new Error(`Query ${key} is not allowed`);
        exception.statusCode = 401;
        throw exception;
      }
      if (!filterQuery[key]) delete filterQuery[key];
    });

    //processing logic
    //Number of items skip for selection
    let offset = limit * (page - 1);

    //Read data from db.json then parse to JSobject
    let db = fs.readFileSync("pokemons.json", "utf-8");
    db = JSON.parse(db);
    const { pokemons, pokemonTypes, totalPokemons } = db;
    //Filter data by title

    let result = [];

    if (filterKeys.length) {
      filterKeys.forEach((condition) => {
        result = result.length
          ? result.filter((pokemon) => {
              let temp;
              if (condition === "search") {
                temp = isNaN(filterQuery[condition])
                  ? pokemon["name"] === filterQuery[condition]
                  : pokemon["id"] === parseInt(filterQuery[condition]);
              } else if (condition === "type") {
                temp = pokemon["types"].includes(filterQuery[condition]);
              } else {
                temp = pokemon[condition] === filterQuery[condition];
              }
              return temp;
            })
          : pokemons.filter((pokemon) => {
              let temp;
              if (condition === "search") {
                temp = isNaN(filterQuery[condition])
                  ? pokemon["name"] === filterQuery[condition]
                  : pokemon["id"] === parseInt(filterQuery[condition]);
              } else if (condition === "type") {
                temp = pokemon["types"].includes(filterQuery[condition]);
              } else {
                temp = pokemon[condition] === filterQuery[condition];
              }
              return temp;
            });
      });
    } else {
      result = pokemons;
    }
    //then select number of result by offset
    result = result.slice(offset, offset + limit);

    //send response
    let dataResult = { data: result };
    res.status(200).send(dataResult);
  } catch (error) {
    next(error);
  }
});

/**
 * params: /
 * description: get a pokemon
 * query:
 * method: get
 */
router.get("/:id", (req, res, next) => {
  try {
    let { id } = req.params;

    if (!id) throw new Error("id is not null");
    id = parseInt(id);

    //Read data from db.json then parse to JSobject
    let db = fs.readFileSync("pokemons.json", "utf-8");
    db = JSON.parse(db);
    const { pokemons } = db;

    const poke = pokemons.find((p) => p.id === id);
    if (!poke) {
      const exception = new Error(`Pokemon not found`);
      exception.statusCode = 401;
      throw exception;
    }

    const index = pokemons.findIndex((p) => p.id === id);
    const pokemon = pokemons.at(index);
    const prevPokemon =
      index === 0 ? pokemons.at(pokemons.length - 1) : pokemons.at(index - 1);
    const nextPokemon =
      index === pokemons.length - 1 ? pokemons.at(0) : pokemons.at(index + 1);

    const result = {
      previousPokemon: prevPokemon,
      pokemon: pokemon,
      nextPokemon: nextPokemon,
    };
    //send response

    res.status(200).send(result);
  } catch (error) {
    next(error);
  }
});

/**
 * params: /
 * description: post a pokemon
 * query:
 * method: post
 */
function getRndInteger(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
router.post("/", (req, res, next) => {
  const { id, name, url, types } = req.body;
  //post input validation
  try {
    //Read data from db.json then parse to JSobject
    let db = fs.readFileSync("pokemons.json", "utf-8");
    db = JSON.parse(db);
    const { pokemons, pokemonTypes, totalPokemons } = db;

    if (!id || !name || !types || !url) {
      const exception = new Error(`Missing required info`);
      exception.statusCode = 401;
      throw exception;
    }

    if (types.length > 2) {
      const exception = new Error(`Pokémon can only have one or two types.`);
      exception.statusCode = 401;
      throw exception;
    }

    let poke = pokemons.find((p) => p.name === name || parseInt(p.id) === id);
    console.log(poke);
    if (poke) {
      const exception = new Error(`The Pokémon already exists.`);
      exception.statusCode = 401;
      throw exception;
    }

    let newTypes = types.filter((t) => t);
    let isTypes = newTypes.map((type) => pokemonTypes.includes(type));

    if (isTypes.includes(false)) {
      const exception = new Error(`Pokémon's type is invalid.`);
      exception.statusCode = 401;
      throw exception;
    }

    // post processing
    const newPokemon = {
      id: id,
      name: name,
      types: newTypes,
      url: url,
    };

    //Add new pokemon to pokemon JS object
    pokemons.push(newPokemon);

    //Add new pokemon to db JS object
    db.pokemons = pokemons;
    db.totalPokemons = pokemons.length;
    //db JSobject to JSON string
    db = JSON.stringify(db);
    //write and save to db.json
    fs.writeFileSync("pokemons.json", db);

    //post send response
    res.status(200).send(newPokemon);
  } catch (error) {
    next(error);
  }
});

/**
 * params: /
 * description: update a pokemon
 * query:
 * method: put
 */

router.put("/:pokemonId", (req, res, next) => {
  //put input validation
  try {
    const allowUpdate = ["name", "types", "url"];
    //Read data from db.json then parse to JSobject
    let db = fs.readFileSync("pokemons.json", "utf-8");
    db = JSON.parse(db);
    const { pokemons, pokemonTypes } = db;

    let { pokemonId } = req.params;
    pokemonId = parseInt(pokemonId);

    const { name, url, types } = req.body;
    const updateInfo = req.body;
    const updateKeys = Object.keys(updateInfo);
    //find update request that not allow
    const notAllow = updateKeys.filter((el) => !allowUpdate.includes(el));

    if (notAllow.length) {
      const exception = new Error(`Update field not allow`);
      exception.statusCode = 401;
      throw exception;
    }

    if (name) {
      let poke = pokemons.find((p) => p.name === name && p.id !== pokemonId);
      if (poke) {
        const exception = new Error(`The Pokémon already exists.`);
        exception.statusCode = 401;
        throw exception;
      }
    }

    if (types) {
      if (types.length > 2) {
        const exception = new Error(`Pokémon can only have one or two types.`);
        exception.statusCode = 401;
        throw exception;
      }
      let newTypes = types.filter((t) => t);
      let isTypes = newTypes.map((type) => pokemonTypes.includes(type));
      if (isTypes.includes(false)) {
        const exception = new Error(`Pokémon's type is invalid.`);
        exception.statusCode = 401;
        throw exception;
      }
    }

    //find pokemon by id
    const targetIndex = pokemons.findIndex(
      (pokemon) => pokemon.id === pokemonId
    );
    if (targetIndex < 0) {
      const exception = new Error(`pokemon not found`);
      exception.statusCode = 404;
      throw exception;
    }
    //Update new content to db pokemon JS object
    const updatedPokemon = { ...db.pokemons[targetIndex], ...updateInfo };
    db.pokemons[targetIndex] = updatedPokemon;

    console.log(db.pokemons[targetIndex]);

    //db JSobject to JSON string

    db = JSON.stringify(db);
    //write and save to db.json
    fs.writeFileSync("pokemons.json", db);

    //put send response
    res.status(200).send(updatedPokemon);
  } catch (error) {
    next(error);
  }
});

/**
 * params: /
 * description: delete a pokemon
 * query:
 * method: delete
 */

router.delete("/:pokemonId", (req, res, next) => {
  //delete input validation
  try {
    let { pokemonId } = req.params;
    if (!pokemonId) throw new Error("id is not null");
    pokemonId = parseInt(pokemonId);

    //delete processing
    //Read data from pokemons.json then parse to JSobject
    let db = fs.readFileSync("pokemons.json", "utf-8");
    db = JSON.parse(db);
    const { pokemons } = db;
    //find pokemon by id
    const targetIndex = pokemons.findIndex(
      (pokemon) => pokemon.id === pokemonId
    );
    if (targetIndex < 0) {
      const exception = new Error(`Pokemon not found`);
      exception.statusCode = 404;
      throw exception;
    }
    //filter db books object
    db.pokemons = pokemons.filter((pokemon) => pokemon.id !== pokemonId);
    db.totalPokemons = db.pokemons.length;
    //db JSobject to JSON string

    db = JSON.stringify(db);
    //write and save to db.json

    fs.writeFileSync("pokemons.json", db);

    //delete send response
    res.status(200).send({});
  } catch (error) {
    next(error);
  }
});

module.exports = router;
