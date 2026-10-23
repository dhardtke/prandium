CREATE INDEX recipe_tag_tag_id_recipe_id ON recipe_tag (tag_id, recipe_id);
CREATE INDEX recipe_tag_tag_id ON recipe_tag (tag_id);
CREATE INDEX recipe_tag_recipe_id ON recipe_tag (recipe_id);
CREATE INDEX recipe_history_recipe_id ON recipe_history (recipe_id);
CREATE INDEX recipe_review_recipe_id ON recipe_review (recipe_id);
