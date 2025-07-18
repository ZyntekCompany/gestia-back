-- AlterTable
ALTER TABLE "RequestExternal" ADD COLUMN     "userId" STRING;

-- AddForeignKey
ALTER TABLE "RequestExternal" ADD CONSTRAINT "RequestExternal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
