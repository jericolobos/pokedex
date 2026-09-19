import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from "react-native";
import { Link } from "expo-router";
import { LEGENDARY_ROSTER } from "../constants/roster";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("All");
  const [sortBy, setSortBy] = useState("gen");

  const regions = ["All", ...new Set(LEGENDARY_ROSTER.map((p) => p.region))];

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedRegion("All");
    setSortBy("gen");
  };

  const filteredAndSortedRoster = LEGENDARY_ROSTER.filter((pokemon) => {
    const matchesSearch = pokemon.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesRegion =
      selectedRegion === "All" || pokemon.region === selectedRegion;
    return matchesSearch && matchesRegion;
  }).sort((a, b) => {
    if (sortBy === "nameAsc") return a.name.localeCompare(b.name);
    if (sortBy === "nameDesc") return b.name.localeCompare(a.name);
    return a.generation - b.generation;
  });

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search Legendaries..."
          placeholderTextColor="#888"
          value={searchQuery}
          onChangeText={setSearchQuery}
          clearButtonMode="while-editing"
        />
      </View>

      {/* Filter and Sort Controls */}
      <View style={styles.controlsContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.regionScroll}
        >
          {regions.map((region) => (
            <TouchableOpacity
              key={region}
              style={[
                styles.filterChip,
                selectedRegion === region && styles.filterChipActive,
              ]}
              onPress={() => setSelectedRegion(region)}
            >
              <Text
                style={[
                  styles.filterText,
                  selectedRegion === region && styles.filterTextActive,
                ]}
              >
                {region}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.sortRow}>
        <TouchableOpacity
          onPress={() =>
            setSortBy(
              sortBy === "nameAsc"
                ? "nameDesc"
                : sortBy === "gen"
                  ? "nameAsc"
                  : "gen",
            )
          }
          style={styles.sortButton}
        >
          <Text style={styles.sortText}>
            Sort:{" "}
            {sortBy === "gen"
              ? "Generation"
              : sortBy === "nameAsc"
                ? "A-Z"
                : "Z-A"}
          </Text>
        </TouchableOpacity>

        {(searchQuery !== "" ||
          selectedRegion !== "All" ||
          sortBy !== "gen") && (
          <TouchableOpacity onPress={clearFilters} style={styles.clearButton}>
            <Text style={styles.clearText}>Clear Filters</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Pokemon Grid/List */}
      <FlatList
        data={filteredAndSortedRoster}
        keyExtractor={(item) => item.name}
        contentContainerStyle={styles.listPadding}
        renderItem={({ item }) => (
          <Link href={`/${item.name}`} asChild>
            <TouchableOpacity style={styles.card}>
              <View style={styles.cardContent}>
                <Text style={styles.name}>{item.name}</Text>
                <View style={styles.badgeContainer}>
                  <Text style={styles.regionBadge}>{item.region}</Text>
                  <Text style={styles.genBadge}>Gen {item.generation}</Text>
                </View>
              </View>
              <View style={styles.chevron}>
                <Text style={styles.chevronText}>›</Text>
              </View>
            </TouchableOpacity>
          </Link>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No Pokémon found.</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F2F2F2" },
  searchContainer: {
    backgroundColor: "#E3350D",
    paddingBottom: 15,
    paddingHorizontal: 16,
  },
  searchInput: {
    height: 46,
    backgroundColor: "#fff",
    borderRadius: 23,
    paddingHorizontal: 20,
    fontSize: 16,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  controlsContainer: { height: 50, marginTop: 10 },
  regionScroll: { paddingHorizontal: 16 },
  filterChip: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    backgroundColor: "#fff",
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    justifyContent: "center",
    elevation: 1,
  },
  filterChipActive: { backgroundColor: "#333", borderColor: "#333" },
  filterText: { color: "#555", fontWeight: "700", fontSize: 13 },
  filterTextActive: { color: "#fff" },
  sortRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  sortButton: {
    backgroundColor: "#E6E6E6",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  sortText: {
    fontWeight: "700",
    color: "#333",
    fontSize: 12,
    textTransform: "uppercase",
  },
  clearButton: { paddingHorizontal: 10 },
  clearText: { color: "#E3350D", fontWeight: "bold", fontSize: 13 },
  listPadding: { paddingBottom: 30 },
  card: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  cardContent: { padding: 20, flex: 1 },
  name: {
    fontSize: 20,
    fontWeight: "800",
    textTransform: "capitalize",
    color: "#1A1A1A",
    marginBottom: 8,
  },
  badgeContainer: { flexDirection: "row", gap: 8 },
  regionBadge: {
    backgroundColor: "#EAEAEA",
    color: "#555",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    fontSize: 12,
    fontWeight: "bold",
    overflow: "hidden",
  },
  genBadge: {
    backgroundColor: "#E3350D20",
    color: "#E3350D",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    fontSize: 12,
    fontWeight: "bold",
    overflow: "hidden",
  },
  chevron: { padding: 20 },
  chevronText: { fontSize: 24, color: "#CCC", fontWeight: "300" },
  emptyText: {
    textAlign: "center",
    marginTop: 40,
    color: "#888",
    fontSize: 16,
    fontStyle: "italic",
  },
});
