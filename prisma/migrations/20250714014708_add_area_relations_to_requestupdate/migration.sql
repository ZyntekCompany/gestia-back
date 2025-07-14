-- AddForeignKey
ALTER TABLE "RequestUpdate" ADD CONSTRAINT "RequestUpdate_fromAreaId_fkey" FOREIGN KEY ("fromAreaId") REFERENCES "Area"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequestUpdate" ADD CONSTRAINT "RequestUpdate_toAreaId_fkey" FOREIGN KEY ("toAreaId") REFERENCES "Area"("id") ON DELETE SET NULL ON UPDATE CASCADE;
