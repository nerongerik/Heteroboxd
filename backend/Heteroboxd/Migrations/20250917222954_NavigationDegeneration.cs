using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Heteroboxd.Migrations
{
    /// <inheritdoc />
    public partial class NavigationDegeneration : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ListEntries_Films_FilmId",
                table: "ListEntries");

            migrationBuilder.DropForeignKey(
                name: "FK_Reports_Users_TargetId",
                table: "Reports");

            migrationBuilder.DropForeignKey(
                name: "FK_UserFavorites_Films_Film1Id",
                table: "UserFavorites");

            migrationBuilder.DropForeignKey(
                name: "FK_UserFavorites_Films_Film2Id",
                table: "UserFavorites");

            migrationBuilder.DropForeignKey(
                name: "FK_UserFavorites_Films_Film3Id",
                table: "UserFavorites");

            migrationBuilder.DropForeignKey(
                name: "FK_UserFavorites_Films_Film4Id",
                table: "UserFavorites");

            migrationBuilder.DropForeignKey(
                name: "FK_UserFavorites_Films_Film5Id",
                table: "UserFavorites");

            migrationBuilder.DropIndex(
                name: "IX_UserFavorites_Film1Id",
                table: "UserFavorites");

            migrationBuilder.DropIndex(
                name: "IX_UserFavorites_Film2Id",
                table: "UserFavorites");

            migrationBuilder.DropIndex(
                name: "IX_UserFavorites_Film3Id",
                table: "UserFavorites");

            migrationBuilder.DropIndex(
                name: "IX_UserFavorites_Film4Id",
                table: "UserFavorites");

            migrationBuilder.DropIndex(
                name: "IX_UserFavorites_Film5Id",
                table: "UserFavorites");

            migrationBuilder.DropIndex(
                name: "IX_Reports_TargetId",
                table: "Reports");

            migrationBuilder.DropIndex(
                name: "IX_ListEntries_FilmId",
                table: "ListEntries");

            migrationBuilder.RenameColumn(
                name: "Film5Id",
                table: "UserFavorites",
                newName: "Film5");

            migrationBuilder.RenameColumn(
                name: "Film4Id",
                table: "UserFavorites",
                newName: "Film4");

            migrationBuilder.RenameColumn(
                name: "Film3Id",
                table: "UserFavorites",
                newName: "Film3");

            migrationBuilder.RenameColumn(
                name: "Film2Id",
                table: "UserFavorites",
                newName: "Film2");

            migrationBuilder.RenameColumn(
                name: "Film1Id",
                table: "UserFavorites",
                newName: "Film1");

            migrationBuilder.AddColumn<DateTime>(
                name: "DateCreated",
                table: "UserLists",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<Guid>(
                name: "UserId",
                table: "Reports",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Reports_UserId",
                table: "Reports",
                column: "UserId");

            migrationBuilder.AddForeignKey(
                name: "FK_Reports_Users_UserId",
                table: "Reports",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Reports_Users_UserId",
                table: "Reports");

            migrationBuilder.DropIndex(
                name: "IX_Reports_UserId",
                table: "Reports");

            migrationBuilder.DropColumn(
                name: "DateCreated",
                table: "UserLists");

            migrationBuilder.DropColumn(
                name: "UserId",
                table: "Reports");

            migrationBuilder.RenameColumn(
                name: "Film5",
                table: "UserFavorites",
                newName: "Film5Id");

            migrationBuilder.RenameColumn(
                name: "Film4",
                table: "UserFavorites",
                newName: "Film4Id");

            migrationBuilder.RenameColumn(
                name: "Film3",
                table: "UserFavorites",
                newName: "Film3Id");

            migrationBuilder.RenameColumn(
                name: "Film2",
                table: "UserFavorites",
                newName: "Film2Id");

            migrationBuilder.RenameColumn(
                name: "Film1",
                table: "UserFavorites",
                newName: "Film1Id");

            migrationBuilder.CreateIndex(
                name: "IX_UserFavorites_Film1Id",
                table: "UserFavorites",
                column: "Film1Id");

            migrationBuilder.CreateIndex(
                name: "IX_UserFavorites_Film2Id",
                table: "UserFavorites",
                column: "Film2Id");

            migrationBuilder.CreateIndex(
                name: "IX_UserFavorites_Film3Id",
                table: "UserFavorites",
                column: "Film3Id");

            migrationBuilder.CreateIndex(
                name: "IX_UserFavorites_Film4Id",
                table: "UserFavorites",
                column: "Film4Id");

            migrationBuilder.CreateIndex(
                name: "IX_UserFavorites_Film5Id",
                table: "UserFavorites",
                column: "Film5Id");

            migrationBuilder.CreateIndex(
                name: "IX_Reports_TargetId",
                table: "Reports",
                column: "TargetId");

            migrationBuilder.CreateIndex(
                name: "IX_ListEntries_FilmId",
                table: "ListEntries",
                column: "FilmId");

            migrationBuilder.AddForeignKey(
                name: "FK_ListEntries_Films_FilmId",
                table: "ListEntries",
                column: "FilmId",
                principalTable: "Films",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Reports_Users_TargetId",
                table: "Reports",
                column: "TargetId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_UserFavorites_Films_Film1Id",
                table: "UserFavorites",
                column: "Film1Id",
                principalTable: "Films",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_UserFavorites_Films_Film2Id",
                table: "UserFavorites",
                column: "Film2Id",
                principalTable: "Films",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_UserFavorites_Films_Film3Id",
                table: "UserFavorites",
                column: "Film3Id",
                principalTable: "Films",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_UserFavorites_Films_Film4Id",
                table: "UserFavorites",
                column: "Film4Id",
                principalTable: "Films",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_UserFavorites_Films_Film5Id",
                table: "UserFavorites",
                column: "Film5Id",
                principalTable: "Films",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }
    }
}
