-- CreateTable
CREATE TABLE `job_runs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(64) NOT NULL,
    `run_date` DATE NOT NULL,
    `started_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `finished_at` DATETIME(3) NULL,
    `status` VARCHAR(16) NOT NULL DEFAULT 'RUNNING',
    `summary` VARCHAR(255) NULL,

    UNIQUE INDEX `job_runs_name_run_date_key`(`name`, `run_date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

