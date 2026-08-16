from datetime import datetime

from pydantic import BaseModel, ConfigDict


class AttendanceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    staff_id: int
    clock_in: datetime
    clock_out: datetime | None = None


class AttendanceStatusResponse(BaseModel):
    is_clocked_in: bool
    attendance: AttendanceResponse | None = None
    worked_seconds: int = 0