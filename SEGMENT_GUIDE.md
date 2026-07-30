# Meal Prep Video Segment Guide

## Overview
Your video segmentation system has been enhanced to capture detailed meal prep and nutritional context. Each video is now broken down into **semantic segments** with specific meal prep and nutrition information.

## Segment Types

When TwelveLabs analyzes your meal prep videos, segments are categorized into these types:

| Segment Type | Description | What Gets Captured |
|---|---|---|
| **ingredient_prep** | Preparing individual ingredients | Chopping, washing, slicing details |
| **cooking** | Active cooking/heating | Temperature, time, techniques |
| **seasoning** | Adding flavors and seasonings | Spices, sauces, flavor profiles |
| **plating** | Arranging food for serving | Presentation, portioning |
| **storage** | Storing prepared food | Storage method, duration guidance |
| **nutrition_info** | Nutritional discussion | Calories, macros, health claims |
| **equipment** | Tools and appliances used | Pans, knives, blenders, etc. |
| **yield** | Portions and servings | Servings, portions per batch |

## What Each Segment Captures

### Nutritional Information
- **Calories**: Total calories per serving (if mentioned)
- **Protein (g)**: Grams of protein
- **Carbs (g)**: Grams of carbohydrates  
- **Fat (g)**: Grams of fat
- **Fiber (g)**: Grams of fiber
- **Allergens**: Common allergens (nuts, dairy, gluten, etc.)

### Cooking Details
- **Temperature**: Oven/cooking temperature (e.g., "425°F")
- **Cook Time**: Minutes and seconds
- **Techniques**: Specific cooking methods (roasting, sautéing, baking, etc.)

### Ingredients
- **Ingredient Name**: Canonical name of the ingredient
- **Quantity**: How much (e.g., "2 cups")
- **Unit**: Measurement unit (cups, grams, tablespoons, etc.)

### Meal Prep Specific
- **Storage Method**: How to store (refrigerator, freezer, room temperature)
- **Storage Duration**: How long it keeps (e.g., "5 days in fridge")
- **Yield/Servings**: How many servings it makes
- **Equipment**: Tools used (shown as tags)

## How to Use

### 1. Viewing Segments
When you open a video in the application, each segment now displays:
- ⏱️ **Time**: Exact start and end times
- 📝 **Type Badge**: What kind of segment (e.g., "cooking", "ingredient_prep")
- 📄 **Description**: What happens in that segment
- 🔥 **Nutrition**: Calories and macronutrient breakdown (if available)
- 🌡️ **Cooking Details**: Temperature and cook time
- 🥕 **Ingredients**: Ingredients used in this step
- 🔪 **Techniques**: Cooking techniques applied
- ⚠️ **Allergens**: Any allergen warnings
- 📦 **Storage Info**: How to store the result
- 🍽️ **Servings**: Number of servings

### 2. Segment Navigation
- **Click any segment** to jump to that part of the video
- **Segments are sorted chronologically** from start to finish
- **Each segment shows time range** for easy reference

### 3. Querying Segments
You can ask questions like:
- "Show me all the protein in this meal prep"
- "What ingredients are roasted vs boiled?"
- "How long does each step take?"
- "What are the allergens in this recipe?"
- "How do I store each component?"

## How It Works (Technical)

### 1. TwelveLabs Analysis
TwelveLabs Pegasus + Marengo break the video into temporal segments with detailed descriptions

### 2. OpenAI Structuring
OpenAI Structured Outputs converts the video description into schema-validated segments with:
- Canonical entity names (merged across videos)
- Typed segment classification
- Extracted nutritional claims
- Cooking parameters
- Dependency relationships

### 3. Neo4j Storage
Segments are stored with relationships:
- `Segment -[:HAS_SEGMENT]-> Video` - Video containment
- `Segment -[:MENTIONS]-> Entity` - People, places, brands
- `Segment -[:USES]-> Ingredient` - Ingredient usage
- `Segment -[:APPLIES]-> Technique` - Cooking techniques
- `Segment -[:NEXT]-> Segment` - Temporal ordering
- `Segment -[:BEFORE]-> Segment` - Dependency ordering

## Example Segment Structure

```json
{
  "segment_type": "cooking",
  "summary": "Roasting tofu cubes at 425°F until crispy",
  "techniques": ["roasting", "baking"],
  "ingredients": [
    {
      "name": "tofu",
      "quantity": "2",
      "unit": "blocks"
    }
  ],
  "cooking_temp": "425°F",
  "cooking_time_min": 25,
  "cooking_time_sec": 0,
  "nutritional_info": {
    "calories": 180,
    "protein_g": 20,
    "carbs_g": 4,
    "fat_g": 11,
    "fiber_g": 2
  },
  "allergens": ["soy"],
  "yield_servings": 4,
  "nutritional_claim": "High protein, low carb"
}
```

## Re-ingesting Videos

To analyze new videos with the enhanced segment system:

```bash
# Make sure you're in the backend directory
cd backend

# Ingest a new video (URL or local file)
uv run python scripts/ingest.py /path/to/video.mp4

# Or ingest from YouTube
uv run python scripts/ingest.py "https://youtube.com/watch?v=..."

# Reset and re-seed the database
cd ..
make reset
make seed
```

## Tips for Better Segments

1. **Clear Audio**: Videos with clear audio get better transcription → better segment descriptions
2. **Visible Ingredients**: Show ingredients clearly on screen
3. **Verbal Descriptions**: Mention nutritional info, cooking temps, times, and storage tips
4. **Equipment Display**: Show equipment you're using
5. **Portion Clarity**: Clearly state how many servings the recipe makes

## Limitations

- **Unstated Info**: If nutritional info isn't mentioned in the video, it won't be captured
- **Ambiguous Ingredients**: Generic references (e.g., "vegetables") won't be as useful as specific names
- **Temperature/Time**: Only captured if explicitly mentioned or visibly shown
- **Storage**: Only captured if the creator discusses storage

## Future Enhancements

Potential features for meal prep context:
- 📊 Nutritional comparison across videos
- 🔗 Recipe matching (find recipes with similar ingredients)
- 📈 Macro tracking (total protein across all meal prep components)
- 💾 Batch cooking optimization (find common ingredients across recipes)
- 🏷️ Dietary filtering (vegetarian, keto, etc.)
