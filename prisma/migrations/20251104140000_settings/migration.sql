-- CreateTable
CREATE TABLE `settings` (
    `key` VARCHAR(64) NOT NULL,
    `value` JSON NOT NULL,
    `updated_at` DATETIME(3) NOT NULL,
    `updated_by` INTEGER NULL,

    PRIMARY KEY (`key`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;


INSERT INTO `settings` (`key`, `value`, `updated_at`) VALUES
  ('opening_hours', '{"open": "08:00", "close": "20:00", "closedDays": ["SUN"], "visitingFrom": "10:00", "visitingUntil": "16:00"}', NOW(3)),
  ('prices', '{"defaultDailyRateGold": 10, "lateFeePerDayGold": 25, "treatmentSuppliesPerNightGold": 5}', NOW(3)),
  ('castle', '{"name": "Bandage Castle", "motto": "We patch them up, you pick them up.", "emergencyRaven": "The tall black one"}', NOW(3));
