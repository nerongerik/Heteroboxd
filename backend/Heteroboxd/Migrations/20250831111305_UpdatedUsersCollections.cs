using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Heteroboxd.Migrations
{
    /// <inheritdoc />
    public partial class UpdatedUsersCollections : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ListEntries_Users_UserId",
                table: "ListEntries");

            migrationBuilder.DropForeignKey(
                name: "FK_ListEntries_Users_UserId1",
                table: "ListEntries");

            migrationBuilder.DropIndex(
                name: "IX_ListEntries_UserId",
                table: "ListEntries");

            migrationBuilder.DropColumn(
                name: "UserId",
                table: "ListEntries");

            migrationBuilder.RenameColumn(
                name: "UserId1",
                table: "ListEntries",
                newName: "WatchlistId");

            migrationBuilder.RenameIndex(
                name: "IX_ListEntries_UserId1",
                table: "ListEntries",
                newName: "IX_ListEntries_WatchlistId");

            migrationBuilder.CreateTable(
                name: "UserFavorites",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Film1Id = table.Column<Guid>(type: "uuid", nullable: true),
                    Film2Id = table.Column<Guid>(type: "uuid", nullable: true),
                    Film3Id = table.Column<Guid>(type: "uuid", nullable: true),
                    Film4Id = table.Column<Guid>(type: "uuid", nullable: true),
                    Film5Id = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserFavorites", x => x.Id);
                    table.ForeignKey(
                        name: "FK_UserFavorites_Films_Film1Id",
                        column: x => x.Film1Id,
                        principalTable: "Films",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_UserFavorites_Films_Film2Id",
                        column: x => x.Film2Id,
                        principalTable: "Films",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_UserFavorites_Films_Film3Id",
                        column: x => x.Film3Id,
                        principalTable: "Films",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_UserFavorites_Films_Film4Id",
                        column: x => x.Film4Id,
                        principalTable: "Films",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_UserFavorites_Films_Film5Id",
                        column: x => x.Film5Id,
                        principalTable: "Films",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_UserFavorites_Users_Id",
                        column: x => x.Id,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Watchlists",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Watchlists", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Watchlists_Users_Id",
                        column: x => x.Id,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

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

            migrationBuilder.AddForeignKey(
                name: "FK_ListEntries_Watchlists_WatchlistId",
                table: "ListEntries",
                column: "WatchlistId",
                principalTable: "Watchlists",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ListEntries_Watchlists_WatchlistId",
                table: "ListEntries");

            migrationBuilder.DropTable(
                name: "UserFavorites");

            migrationBuilder.DropTable(
                name: "Watchlists");

            migrationBuilder.RenameColumn(
                name: "WatchlistId",
                table: "ListEntries",
                newName: "UserId1");

            migrationBuilder.RenameIndex(
                name: "IX_ListEntries_WatchlistId",
                table: "ListEntries",
                newName: "IX_ListEntries_UserId1");

            migrationBuilder.AddColumn<Guid>(
                name: "UserId",
                table: "ListEntries",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_ListEntries_UserId",
                table: "ListEntries",
                column: "UserId");

            migrationBuilder.AddForeignKey(
                name: "FK_ListEntries_Users_UserId",
                table: "ListEntries",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_ListEntries_Users_UserId1",
                table: "ListEntries",
                column: "UserId1",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
