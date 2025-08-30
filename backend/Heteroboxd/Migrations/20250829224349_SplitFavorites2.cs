using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Heteroboxd.Migrations
{
    /// <inheritdoc />
    public partial class SplitFavorites2 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "UserFavorites");

            migrationBuilder.AlterColumn<Guid>(
                name: "AuthorId",
                table: "UserLists",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"),
                oldClrType: typeof(Guid),
                oldType: "uuid",
                oldNullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "UserId1",
                table: "ListEntries",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_ListEntries_UserId1",
                table: "ListEntries",
                column: "UserId1");

            migrationBuilder.AddForeignKey(
                name: "FK_ListEntries_Users_UserId1",
                table: "ListEntries",
                column: "UserId1",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ListEntries_Users_UserId1",
                table: "ListEntries");

            migrationBuilder.DropIndex(
                name: "IX_ListEntries_UserId1",
                table: "ListEntries");

            migrationBuilder.DropColumn(
                name: "UserId1",
                table: "ListEntries");

            migrationBuilder.AlterColumn<Guid>(
                name: "AuthorId",
                table: "UserLists",
                type: "uuid",
                nullable: true,
                oldClrType: typeof(Guid),
                oldType: "uuid");

            migrationBuilder.CreateTable(
                name: "UserFavorites",
                columns: table => new
                {
                    FavoritesId = table.Column<Guid>(type: "uuid", nullable: false),
                    User1Id = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserFavorites", x => new { x.FavoritesId, x.User1Id });
                    table.ForeignKey(
                        name: "FK_UserFavorites_UserLists_FavoritesId",
                        column: x => x.FavoritesId,
                        principalTable: "UserLists",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_UserFavorites_Users_User1Id",
                        column: x => x.User1Id,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_UserFavorites_User1Id",
                table: "UserFavorites",
                column: "User1Id");
        }
    }
}
