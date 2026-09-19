import React from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { usePokemonFetch } from "../hooks/usePokemonFetch";

export default function EvolutionChain({ url }: { url: string }) {
  const { data, isLoading, error } = usePokemonFetch(url);

  if (isLoading) {
    return <ActivityIndicator size="small" color="#e63946" />;
  }

  if (error || !data || !data.chain) {
    return <Text style={styles.text}>Failed to load evolution data.</Text>;
  }

  // Extract all Pokémon names in the chain
  const allNames: string[] = [];
  const traverseChain = (node: any) => {
    allNames.push(node.species.name);
    node.evolves_to.forEach(traverseChain);
  };
  traverseChain(data.chain);

  // REQ-4.4.3: Gracefully indicate if the Pokémon has a single-stage chain
  if (allNames.length === 1) {
    return <Text style={styles.text}>Does not evolve</Text>;
  }

  return (
    <View style={styles.chainContainer}>
      {allNames.map((name) => (
        <View key={name} style={styles.stageBadge}>
          <Text style={styles.stageText}>{name}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  text: {
    fontSize: 15,
    color: "#6c757d",
    fontStyle: "italic",
    marginBottom: 40,
  },
  chainContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 40,
  },
  stageBadge: {
    backgroundColor: "#e9ecef",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#dee2e6",
  },
  stageText: {
    color: "#212529",
    fontWeight: "bold",
    textTransform: "capitalize",
  },
});
