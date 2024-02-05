-- CreateTable
CREATE TABLE `invoices_v2` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `legacy_invoice_id` INTEGER NULL,
    `stay_id` INTEGER NULL,
    `customer_id` INTEGER NOT NULL,
    `number` VARCHAR(20) NOT NULL,
    `status` VARCHAR(16) NOT NULL DEFAULT 'DRAFT',
    `issued_at` DATETIME(3) NULL,
    `due_at` DATE NULL,
    `subtotal_copper` INTEGER NOT NULL DEFAULT 0,
    `total_copper` INTEGER NOT NULL DEFAULT 0,
    `notes` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `invoices_v2_legacy_invoice_id_key`(`legacy_invoice_id`),
    UNIQUE INDEX `invoices_v2_number_key`(`number`),
    INDEX `invoices_v2_customer_id_idx`(`customer_id`),
    INDEX `invoices_v2_stay_id_idx`(`stay_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `invoice_lines_v2` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `invoice_id` INTEGER NOT NULL,
    `description` VARCHAR(255) NOT NULL,
    `quantity` INTEGER NOT NULL DEFAULT 1,
    `unit_copper` INTEGER NOT NULL,
    `amount_copper` INTEGER NOT NULL,
    `kind` VARCHAR(16) NOT NULL DEFAULT 'OTHER',
    `position` INTEGER NOT NULL DEFAULT 0,

    INDEX `invoice_lines_v2_invoice_id_idx`(`invoice_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payments_v2` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `invoice_id` INTEGER NOT NULL,
    `amount_copper` INTEGER NOT NULL,
    `method` VARCHAR(16) NOT NULL,
    `received_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `received_by_id` INTEGER NULL,
    `note` VARCHAR(255) NULL,

    INDEX `payments_v2_invoice_id_idx`(`invoice_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

