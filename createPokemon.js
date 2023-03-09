const fs = require("fs");
const csv = require("csvtojson");

const createPokemon = async () => {
  let newData = await csv().fromFile("pokemon.csv");
  newData = new Set(newData.map((e) => e));
  newData = Array.from(newData);
  newData = newData.map((e) => {
    return e;
  });

  const files = fs.readdirSync("./images/images");
  console.log(newData.length);
  console.log(files);

  let i = 1;
  newData = newData
    .filter((e) => files.includes(`${e.Name}.png`))
    .map((e) => {
      let types = [e.Type1.toLowerCase()];
      if (e.Type2) types.push(e.Type2.toLowerCase());

      fs.copyFile(
        `./images/images/${e.Name}.png`,
        `./images/pokemons/${i}.png`,
        (err) => {
          if (err) throw err;
          console.log("File was copied to destination");
        }
      );

      return {
        id: i,
        name: e.Name,
        types: types,
        url: `http://localhost:5000/images/pokemons/${i++}.png`,
      };
    });
  console.log(newData.length);

  let data = JSON.parse(fs.readFileSync("pokemons.json"));
  data.pokemons = newData;
  data.totalPokemons = newData.length;
  fs.writeFileSync("pokemons.json", JSON.stringify(data));
  console.log("done");
};

createPokemon();
