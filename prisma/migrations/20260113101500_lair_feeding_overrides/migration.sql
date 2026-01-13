-- CreateTable
CREATE TABLE `lair_feeding_overrides` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `lair_id` INTEGER NOT NULL,
    `species_id` INTEGER NULL,
    `meals_per_day` INTEGER NULL,
    `portion_kg` DECIMAL(6, 2) NULL,
    `food` VARCHAR(255) NULL,
    `note` VARCHAR(255) NULL,
    `created_by_id` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `lair_feeding_overrides_lair_id_idx`(`lair_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

