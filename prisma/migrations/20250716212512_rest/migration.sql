/*
  Warnings:

  - The values [Instutucion,Policias] on the enum `TypeEntity` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
ALTER TYPE "TypeEntity"DROP VALUE 'Instutucion';
ALTER TYPE "TypeEntity"DROP VALUE 'Policias';
