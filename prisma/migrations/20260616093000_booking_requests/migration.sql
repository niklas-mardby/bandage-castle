-- CreateTable
CREATE TABLE `booking_requests` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `customer_id` INTEGER NOT NULL,
    `monster_id` INTEGER NOT NULL,
    `reason` VARCHAR(32) NOT NULL,
    `start_date` DATE NOT NULL,
    `end_date` DATE NOT NULL,
    `message` TEXT NULL,
    `status` VARCHAR(16) NOT NULL DEFAULT 'PENDING',
    `decline_note` VARCHAR(255) NULL,
    `stay_id` INTEGER NULL,
    `decided_by_id` INTEGER NULL,
    `decided_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `booking_requests_customer_id_idx`(`customer_id`),
    INDEX `booking_requests_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

