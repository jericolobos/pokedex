const fs = require("fs");
const path = require("path");

const GENERATIONS = [
  { gen: 1, limit: 151, offset: 0, region: "Kanto" },
  { gen: 2, limit: 100, offset: 151, region: "Johto" },
  { gen: 3, limit: 135, offset: 251, region: "Hoenn" },
  { gen: 4, limit: 107, offset: 386, region: "Sinnoh" },
  { gen: 5, limit: 156, offset: 493, region: "Unova" },
  { gen: 6, limit: 72, offset: 649, region: "Kalos" },
];

async function build() {
  console.log("Starting Pokédex fetch for Gen 1-6 (721 Pokémon)...");
  let roster = [];

  for (const g of GENERATIONS) {
    console.log(`\nFetching ${g.region}...`);
    const res = await fetch(
      `https://pokeapi.co/api/v2/pokemon?limit=${g.limit}&offset=${g.offset}`,
    );
    const data = await res.json();

    for (let i = 0; i < data.results.length; i++) {
      const p = data.results[i];
      try {
        const detailRes = await fetch(p.url);
        const detail = await detailRes.json();

        // Isolate the primary type to categorize them in the UI
        const type = detail.types[0].type.name;

        roster.push({
          name: p.name,
          type: type.charAt(0).toUpperCase() + type.slice(1),
          generation: g.gen,
          region: g.region,
        });

        // Prints a dot so you can see it working
        process.stdout.write(".");
      } catch (e) {
        console.error(`\nFailed to fetch ${p.name}`);
      }
    }
  }

  console.log("\n\nAll 721 Pokémon fetched successfully!");

  // Format the file contents
  const fileContent = `// Automatically generated National Pokédex\nexport const LEGENDARY_ROSTER = ${JSON.stringify(roster, null, 2)};\n`;

  // Save directly into your constants folder
  const targetPath = path.join(__dirname, "src", "constants", "roster.js");
  fs.writeFileSync(targetPath, fileContent);
  console.log(
    `\nSaved to ${targetPath}! Refresh Expo Go to see the National Pokédex!`,
  );
}

build();
