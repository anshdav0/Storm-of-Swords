
--making these values nullable so that could use the same table for a generic building could have done something else but this is the simplest way
ALTER TABLE "producer_building" 
  ALTER COLUMN "resource_type" SET NOT NULL,
  ALTER COLUMN "production_rate" SET NOT NULL,
  ALTER COLUMN "production_cap" SET NOT NULL;