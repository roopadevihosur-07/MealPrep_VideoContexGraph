"use client";

import { useEffect, useState } from "react";
import {
  Box, Flex, Grid, Heading, Text, VStack, HStack, Badge, Spinner, Button, Card, Progress,
} from "@chakra-ui/react";
import { ArrowLeft, Flame, Droplet, Leaf, Zap } from "lucide-react";
import { API_BASE } from "@/lib/config";

const colors = {
  cream: "#f4f3e7",
  deepForest: "#00473c",
  limeGlow: "#e6ff55",
  sageMist: "#d8e5d6",
  warmSand: "#e8dcc6",
  forestShadow: "#0e150e",
};

interface MealPrepData {
  video: { title: string; summary: string };
  total_segments: number;
  nutrition_summary: {
    total_calories: number;
    total_protein_g: number;
    total_carbs_g: number;
    total_fat_g: number;
    total_fiber_g: number;
  };
  per_serving: {
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
  };
  macro_percentages: {
    protein_percent: number;
    carbs_percent: number;
    fat_percent: number;
  };
  ingredients: string[];
  techniques: string[];
  allergens: string[];
  health_claims: string[];
  total_servings: number;
}

interface MealPrepDashboardProps {
  videoId: string;
  onBack: () => void;
}

export function MealPrepDashboard({ videoId, onBack }: MealPrepDashboardProps) {
  const [data, setData] = useState<MealPrepData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/meal-prep/${encodeURIComponent(videoId)}/details`);
        if (!res.ok) throw new Error("Failed to load meal prep details");
        const details = await res.json();
        setData(details);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    })();
  }, [videoId]);

  if (loading) {
    return (
      <Flex align="center" justify="center" h="100%" color={colors.deepForest}>
        <Spinner size="lg" />
      </Flex>
    );
  }

  if (error || !data) {
    return (
      <Box p={6} color={colors.deepForest}>
        <Button mb={4} variant="ghost" onClick={onBack}>
          <ArrowLeft size={18} /> Back
        </Button>
        <Text color="red.500">{error || "No data found"}</Text>
      </Box>
    );
  }

  const { video, nutrition_summary, per_serving, macro_percentages, ingredients, techniques, allergens, health_claims, total_servings } = data;

  return (
    <Box bg={colors.cream} minH="100vh" p={6} overflowY="auto">
      <VStack spacing={8} align="stretch" maxW="1200px" mx="auto">
        {/* Header */}
        <HStack justify="space-between" align="start">
          <Button variant="ghost" onClick={onBack} color={colors.deepForest}>
            <ArrowLeft size={20} /> Back
          </Button>
          <VStack align="start" spacing={2} flex={1} ml={4}>
            <Heading fontSize="32px" fontWeight="400" color={colors.forestShadow}>
              {video.title}
            </Heading>
            <Text fontSize="14px" color={colors.deepForest} opacity={0.85}>
              {video.summary}
            </Text>
          </VStack>
        </HStack>

        {/* Nutrition Overview Cards */}
        <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={6}>
          {/* Total Nutrition */}
          <Box bg={colors.sageMist} p={6} borderRadius="20px">
            <Heading fontSize="20px" fontWeight="600" mb={4} color={colors.deepForest}>
              📊 Total Nutrition
            </Heading>
            <VStack spacing={4} align="start">
              <HStack justify="space-between" w="100%">
                <Text fontSize="14px" color={colors.deepForest}>Total Calories</Text>
                <Text fontSize="24px" fontWeight="700" color={colors.deepForest}>
                  {nutrition_summary.total_calories}
                </Text>
              </HStack>
              <Box w="100%">
                <HStack justify="space-between" mb={2}>
                  <Text fontSize="13px" color={colors.deepForest}>🥚 Protein</Text>
                  <Text fontSize="13px" fontWeight="600" color={colors.deepForest}>
                    {nutrition_summary.total_protein_g}g
                  </Text>
                </HStack>
                <Progress.Root value={(nutrition_summary.total_protein_g / 100) * 100} size="sm" colorPalette="green">
                  <Progress.Track bg={colors.sageMist} borderRadius="4px">
                    <Progress.Range />
                  </Progress.Track>
                </Progress.Root>
              </Box>
              <Box w="100%">
                <HStack justify="space-between" mb={2}>
                  <Text fontSize="13px" color={colors.deepForest}>🌾 Carbs</Text>
                  <Text fontSize="13px" fontWeight="600" color={colors.deepForest}>
                    {nutrition_summary.total_carbs_g}g
                  </Text>
                </HStack>
                <Progress.Root value={(nutrition_summary.total_carbs_g / 100) * 100} size="sm" colorPalette="orange">
                  <Progress.Track bg={colors.sageMist} borderRadius="4px">
                    <Progress.Range />
                  </Progress.Track>
                </Progress.Root>
              </Box>
              <Box w="100%">
                <HStack justify="space-between" mb={2}>
                  <Text fontSize="13px" color={colors.deepForest}>🫒 Fat</Text>
                  <Text fontSize="13px" fontWeight="600" color={colors.deepForest}>
                    {nutrition_summary.total_fat_g}g
                  </Text>
                </HStack>
                <Progress.Root value={(nutrition_summary.total_fat_g / 100) * 100} size="sm" colorPalette="red">
                  <Progress.Track bg={colors.sageMist} borderRadius="4px">
                    <Progress.Range />
                  </Progress.Track>
                </Progress.Root>
              </Box>
              <HStack justify="space-between" w="100%" pt={2} borderTop={`1px solid ${colors.deepForest}`} opacity={0.5}>
                <Text fontSize="13px" color={colors.deepForest}>🌿 Fiber</Text>
                <Text fontSize="13px" fontWeight="600" color={colors.deepForest}>{nutrition_summary.total_fiber_g}g</Text>
              </HStack>
            </VStack>
          </Box>

          {/* Per Serving */}
          <Box bg={colors.warmSand} p={6} borderRadius="20px">
            <Heading fontSize="20px" fontWeight="600" mb={4} color={colors.deepForest}>
              🍽️ Per Serving ({total_servings} servings)
            </Heading>
            <VStack spacing={4} align="start">
              <HStack justify="space-between" w="100%">
                <Text fontSize="14px" color={colors.deepForest}>Calories per Serving</Text>
                <Text fontSize="24px" fontWeight="700" color={colors.deepForest}>
                  {per_serving.calories}
                </Text>
              </HStack>
              <HStack justify="space-between" w="100%" fontSize="13px" color={colors.deepForest}>
                <Text>🥚 Protein</Text>
                <Text fontWeight="600">{per_serving.protein_g}g</Text>
              </HStack>
              <HStack justify="space-between" w="100%" fontSize="13px" color={colors.deepForest}>
                <Text>🌾 Carbs</Text>
                <Text fontWeight="600">{per_serving.carbs_g}g</Text>
              </HStack>
              <HStack justify="space-between" w="100%" fontSize="13px" color={colors.deepForest}>
                <Text>🫒 Fat</Text>
                <Text fontWeight="600">{per_serving.fat_g}g</Text>
              </HStack>
            </VStack>
          </Box>
        </Grid>

        {/* Macro Breakdown */}
        <Box bg={colors.sageMist} p={6} borderRadius="20px">
          <Heading fontSize="20px" fontWeight="600" mb={6} color={colors.deepForest}>
            📈 Macronutrient Breakdown
          </Heading>
          <Grid templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }} gap={4}>
            <Box textAlign="center">
              <Text fontSize="32px" fontWeight="700" color="#ef4444">
                {macro_percentages.protein_percent}%
              </Text>
              <Text fontSize="13px" color={colors.deepForest} mt={2}>Protein</Text>
              <Text fontSize="12px" color={colors.deepForest} opacity={0.7}>
                {nutrition_summary.total_protein_g}g total
              </Text>
            </Box>
            <Box textAlign="center">
              <Text fontSize="32px" fontWeight="700" color="#f59e0b">
                {macro_percentages.carbs_percent}%
              </Text>
              <Text fontSize="13px" color={colors.deepForest} mt={2}>Carbs</Text>
              <Text fontSize="12px" color={colors.deepForest} opacity={0.7}>
                {nutrition_summary.total_carbs_g}g total
              </Text>
            </Box>
            <Box textAlign="center">
              <Text fontSize="32px" fontWeight="700" color="#f87171">
                {macro_percentages.fat_percent}%
              </Text>
              <Text fontSize="13px" color={colors.deepForest} mt={2}>Fat</Text>
              <Text fontSize="12px" color={colors.deepForest} opacity={0.7}>
                {nutrition_summary.total_fat_g}g total
              </Text>
            </Box>
          </Grid>
        </Box>

        {/* Ingredients */}
        <Box bg={colors.warmSand} p={6} borderRadius="20px">
          <Heading fontSize="20px" fontWeight="600" mb={4} color={colors.deepForest}>
            🥕 Ingredients ({ingredients.length})
          </Heading>
          <Flex flexWrap="wrap" gap={2}>
            {ingredients.map((ing) => (
              <Badge key={ing} bg={colors.limeGlow} color={colors.deepForest} px={3} py={2} borderRadius="9999px">
                {ing}
              </Badge>
            ))}
          </Flex>
        </Box>

        {/* Cooking Techniques */}
        <Box bg={colors.sageMist} p={6} borderRadius="20px">
          <Heading fontSize="20px" fontWeight="600" mb={4} color={colors.deepForest}>
            🔪 Cooking Techniques ({techniques.length})
          </Heading>
          <Flex flexWrap="wrap" gap={2}>
            {techniques.map((tech) => (
              <Badge key={tech} bg={colors.deepForest} color="white" px={3} py={2} borderRadius="9999px">
                {tech}
              </Badge>
            ))}
          </Flex>
        </Box>

        {/* Health Benefits & Claims */}
        {health_claims.length > 0 && (
          <Box bg={colors.limeGlow} p={6} borderRadius="20px">
            <Heading fontSize="20px" fontWeight="600" mb={4} color={colors.deepForest}>
              ✨ Health Benefits & Claims
            </Heading>
            <VStack spacing={2} align="start">
              {health_claims.map((claim, idx) => (
                <HStack key={idx} w="100%">
                  <Text fontSize="18px">✓</Text>
                  <Text fontSize="14px" color={colors.deepForest}>
                    {claim}
                  </Text>
                </HStack>
              ))}
            </VStack>
          </Box>
        )}

        {/* Allergen Warnings */}
        {allergens.length > 0 && (
          <Box bg="#fee2e2" p={6} borderRadius="20px" borderLeft={`4px solid #ef4444`}>
            <Heading fontSize="20px" fontWeight="600" mb={4} color="#7f1d1d">
              ⚠️ Allergen Information
            </Heading>
            <Flex flexWrap="wrap" gap={2}>
              {allergens.map((allergen) => (
                <Badge key={allergen} bg="#fecaca" color="#7f1d1d" px={3} py={2} borderRadius="9999px">
                  {allergen}
                </Badge>
              ))}
            </Flex>
          </Box>
        )}

        {/* Calorie Details */}
        <Box bg={colors.sageMist} p={6} borderRadius="20px">
          <Heading fontSize="20px" fontWeight="600" mb={4} color={colors.deepForest}>
            🔬 Calorie Breakdown
          </Heading>
          <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={4}>
            <VStack align="start" spacing={3}>
              <Text fontSize="13px" fontWeight="600" color={colors.deepForest}>From Protein</Text>
              <HStack>
                <Text fontSize="24px" fontWeight="700" color={colors.deepForest}>
                  {Math.round(nutrition_summary.total_protein_g * 4)}
                </Text>
                <Text fontSize="12px" color={colors.deepForest} opacity={0.7}>calories</Text>
              </HStack>
              <Text fontSize="11px" color={colors.deepForest} opacity={0.6}>
                {nutrition_summary.total_protein_g}g × 4 cal/g
              </Text>
            </VStack>
            <VStack align="start" spacing={3}>
              <Text fontSize="13px" fontWeight="600" color={colors.deepForest}>From Carbs</Text>
              <HStack>
                <Text fontSize="24px" fontWeight="700" color={colors.deepForest}>
                  {Math.round(nutrition_summary.total_carbs_g * 4)}
                </Text>
                <Text fontSize="12px" color={colors.deepForest} opacity={0.7}>calories</Text>
              </HStack>
              <Text fontSize="11px" color={colors.deepForest} opacity={0.6}>
                {nutrition_summary.total_carbs_g}g × 4 cal/g
              </Text>
            </VStack>
            <VStack align="start" spacing={3}>
              <Text fontSize="13px" fontWeight="600" color={colors.deepForest}>From Fat</Text>
              <HStack>
                <Text fontSize="24px" fontWeight="700" color={colors.deepForest}>
                  {Math.round(nutrition_summary.total_fat_g * 9)}
                </Text>
                <Text fontSize="12px" color={colors.deepForest} opacity={0.7}>calories</Text>
              </HStack>
              <Text fontSize="11px" color={colors.deepForest} opacity={0.6}>
                {nutrition_summary.total_fat_g}g × 9 cal/g
              </Text>
            </VStack>
            <Box p={3} bg={colors.deepForest} borderRadius="12px" color="white">
              <Text fontSize="13px" fontWeight="600" mb={2}>Total Calculation</Text>
              <Text fontSize="11px" opacity={0.9} lineHeight="1.6">
                ({nutrition_summary.total_protein_g}g × 4) + ({nutrition_summary.total_carbs_g}g × 4) + ({nutrition_summary.total_fat_g}g × 9) = {nutrition_summary.total_calories} cal
              </Text>
            </Box>
          </Grid>
        </Box>
      </VStack>
    </Box>
  );
}
