using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Heteroboxd.Migrations
{
    /// <inheritdoc />
    public partial class CelebrityCreditsFiasco2 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Celebrities_Films_FilmId",
                table: "Celebrities");

            migrationBuilder.DropIndex(
                name: "IX_Celebrities_FilmId",
                table: "Celebrities");

            migrationBuilder.DropColumn(
                name: "FilmId",
                table: "Celebrities");

            migrationBuilder.AlterColumn<Guid>(
                name: "CelebrityId",
                table: "CelebrityCredits",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"),
                oldClrType: typeof(Guid),
                oldType: "uuid",
                oldNullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<Guid>(
                name: "CelebrityId",
                table: "CelebrityCredits",
                type: "uuid",
                nullable: true,
                oldClrType: typeof(Guid),
                oldType: "uuid");

            migrationBuilder.AddColumn<Guid>(
                name: "FilmId",
                table: "Celebrities",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Celebrities_FilmId",
                table: "Celebrities",
                column: "FilmId");

            migrationBuilder.AddForeignKey(
                name: "FK_Celebrities_Films_FilmId",
                table: "Celebrities",
                column: "FilmId",
                principalTable: "Films",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
