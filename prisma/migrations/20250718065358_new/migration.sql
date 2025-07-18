-- AlterTable
ALTER TABLE "Document" ADD COLUMN     "requestExternalId" STRING;

-- CreateTable
CREATE TABLE "RequestExternal" (
    "id" STRING NOT NULL,
    "radicado" STRING,
    "typeRequest" STRING NOT NULL,
    "recipient" STRING NOT NULL,
    "mailrecipient" STRING NOT NULL,
    "maxResponseDays" INT4 NOT NULL,
    "subject" STRING NOT NULL,
    "content" JSONB NOT NULL,
    "status" "RequestStatus" NOT NULL,
    "entityId" STRING NOT NULL,
    "deadline" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RequestExternal_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_requestExternalId_fkey" FOREIGN KEY ("requestExternalId") REFERENCES "RequestExternal"("id") ON DELETE SET NULL ON UPDATE CASCADE;
