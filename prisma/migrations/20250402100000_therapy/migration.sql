-- CreateTable
CREATE TABLE `therapy_plans` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `monster_id` INTEGER NOT NULL,
    `therapist_id` INTEGER NOT NULL,
    `issue` VARCHAR(32) NOT NULL,
    `goals` TEXT NOT NULL,
    `status` VARCHAR(16) NOT NULL DEFAULT 'ACTIVE',
    `started_at` DATE NOT NULL,
    `ended_at` DATE NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `therapy_plans_monster_id_idx`(`monster_id`),
    INDEX `therapy_plans_therapist_id_idx`(`therapist_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `therapy_sessions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `plan_id` INTEGER NOT NULL,
    `session_date` DATE NOT NULL,
    `duration_min` INTEGER NOT NULL DEFAULT 50,
    `mood_before` INTEGER NOT NULL,
    `mood_after` INTEGER NOT NULL,
    `notes` TEXT NOT NULL,
    `homework` VARCHAR(255) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `therapy_sessions_plan_id_idx`(`plan_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

