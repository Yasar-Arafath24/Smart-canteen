from datetime import datetime

from pydantic import BaseModel, ConfigDict


class ActivityResponse(BaseModel):
    model_config = ConfigDict(
        from_attributes=True,
    )

    id: int
    actor_id: int | None
    actor_name: str | None

    action: str

    entity_type: str | None
    entity_id: int | None

    description: str
    created_at: datetime