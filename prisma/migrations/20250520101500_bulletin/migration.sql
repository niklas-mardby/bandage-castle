-- CreateTable
CREATE TABLE `bulletin_pages` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `slug` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `body_md` TEXT NOT NULL,
    `kind` VARCHAR(8) NOT NULL DEFAULT 'POST',
    `status` VARCHAR(16) NOT NULL DEFAULT 'DRAFT',
    `pinned` BOOLEAN NOT NULL DEFAULT false,
    `author_id` INTEGER NOT NULL,
    `published_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `bulletin_pages_slug_key`(`slug`),
    INDEX `bulletin_pages_kind_status_idx`(`kind`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `bulletin_revisions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `page_id` INTEGER NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `body_md` TEXT NOT NULL,
    `edited_by_id` INTEGER NOT NULL,
    `edited_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `bulletin_revisions_page_id_idx`(`page_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

