import React from "react";
import { ActivityIndicator, Image, StyleSheet, Text, View } from "react-native";
import { usePokemonFetch } from "../hooks/usePokemonFetch";

// ============================================================================
// 1. INDIVIDUAL STAGE BADGE (Fetches the image for each evolution)
// ============================================================================
const EvolutionBadge = ({ name }: { name: string }) => {
  // Fetch the specific Pokémon's data to grab its official artwork
  const { data: pokemon, isLoading } = usePokemonFetch(
    `https://pokeapi.co/api/v2/pokemon/${name}`,
  );

  const imageUrl =
    pokemon?.sprites?.other?.["official-artwork"]?.front_default ||
    pokemon?.sprites?.front_default;

  return (
    <View style={styles.stageBadge}>
      {isLoading || !imageUrl ? (
        <View style={styles.imagePlaceholder}>
          <ActivityIndicator size="small" color="#fff" />
        </View>
      ) : (
        <Image
          source={{ uri: imageUrl }}
          style={styles.stageImage}
          resizeMode="contain"
        />
      )}
      <Text style={styles.stageText}>{name.replace("-", " ")}</Text>
    </View>
  );
};

// ============================================================================
// 2. MAIN COMPONENT (Traverses the chain)
// ============================================================================
export default function EvolutionChain({ url }: { url: string }) {
  const { data, isLoading, error } = usePokemonFetch(url);

  if (isLoading) {
    return <ActivityIndicator size="small" color="#fff" />;
  }

  if (error || !data || !data.chain) {
    return <Text style={styles.text}>Failed to load evolution data.</Text>;
  }

  // Flatten the nested evolution tree into a simple array of names
  const allNames: string[] = [];
  const traverseChain = (node: any) => {
    allNames.push(node.species.name);
    node.evolves_to.forEach(traverseChain);
  };
  traverseChain(data.chain);

  if (allNames.length === 1) {
    return <Text style={styles.text}>Does not evolve</Text>;
  }

  return (
    <View style={styles.chainContainer}>
      {allNames.map((name, index) => (
        <React.Fragment key={name}>
          <EvolutionBadge name={name} />

          {/* Render an arrow between stages, except after the final stage */}
          {index < allNames.length - 1 && (
            <Text style={styles.arrowText}>→</Text>
          )}
        </React.Fragment>
      ))}
    </View>
  );
}

// ============================================================================
// 3. STYLES
// ============================================================================
const styles = StyleSheet.create({
  text: {
    fontSize: 15,
    color: "#888",
    fontStyle: "italic",
    marginBottom: 40,
    textAlign: "center",
  },
  chainContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "center",
    gap: 8, // Tighter gap to fit the arrows
    marginBottom: 40,
  },
  stageBadge: {
    alignItems: "center",
    backgroundColor: "#2A2A2A",
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#444",
    width: 90, // Fixed width so Bulbasaur and Venusaur badges match in size
  },
  stageImage: {
    width: 60,
    height: 60,
    marginBottom: 8,
  },
  imagePlaceholder: {
    width: 60,
    height: 60,
    marginBottom: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  stageText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 12,
    textTransform: "capitalize",
    textAlign: "center",
  },
  arrowText: {
    color: "#888",
    fontSize: 18,
    fontWeight: "bold",
    marginHorizontal: 2,
  },
});
