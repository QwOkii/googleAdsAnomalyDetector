/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `Campaign` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Campaign" ADD COLUMN     "dateFrom" TIMESTAMP(3),
ADD COLUMN     "dateTo" TIMESTAMP(3),
ADD COLUMN     "impressions" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE UNIQUE INDEX "Campaign_name_key" ON "Campaign"("name");
