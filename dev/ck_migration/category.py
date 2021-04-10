from typing import TypedDict, Optional


class Category(TypedDict):
    id: str  # the category ID
    tag: Optional[str]  # a tag to assign for each recipe in the category or None
    use_created_at_history: bool  # Whether the created_at date should be used for a single history entry
    rating: Optional[float]  # The rating to apply to each recipe in the category or None
