-- CreateTable
CREATE TABLE `feature_flags` (
    `key` VARCHAR(64) NOT NULL,
    `enabled` BOOLEAN NOT NULL DEFAULT false,
    `description` VARCHAR(255) NULL,
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`key`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;


INSERT INTO `feature_flags` (`key`, `enabled`, `description`, `updated_at`) VALUES
  ('ENABLE_BILLING_V2', false, 'Use the copper-based Billing v2 engine for invoices', NOW(3));
