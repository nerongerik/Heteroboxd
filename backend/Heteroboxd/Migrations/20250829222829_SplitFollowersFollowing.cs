using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Heteroboxd.Migrations
{
    /// <inheritdoc />
    public partial class SplitFollowersFollowing : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_UserBlocked_Users_UserId",
                table: "UserBlocked");

            migrationBuilder.DropForeignKey(
                name: "FK_UserFollowers_Users_FollowingId",
                table: "UserFollowers");

            migrationBuilder.RenameColumn(
                name: "FollowingId",
                table: "UserFollowers",
                newName: "UserId");

            migrationBuilder.RenameIndex(
                name: "IX_UserFollowers_FollowingId",
                table: "UserFollowers",
                newName: "IX_UserFollowers_UserId");

            migrationBuilder.RenameColumn(
                name: "UserId",
                table: "UserBlocked",
                newName: "User2Id");

            migrationBuilder.RenameIndex(
                name: "IX_UserBlocked_UserId",
                table: "UserBlocked",
                newName: "IX_UserBlocked_User2Id");

            migrationBuilder.CreateTable(
                name: "UserFollowing",
                columns: table => new
                {
                    FollowingId = table.Column<Guid>(type: "uuid", nullable: false),
                    User1Id = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserFollowing", x => new { x.FollowingId, x.User1Id });
                    table.ForeignKey(
                        name: "FK_UserFollowing_Users_FollowingId",
                        column: x => x.FollowingId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_UserFollowing_Users_User1Id",
                        column: x => x.User1Id,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_UserFollowing_User1Id",
                table: "UserFollowing",
                column: "User1Id");

            migrationBuilder.AddForeignKey(
                name: "FK_UserBlocked_Users_User2Id",
                table: "UserBlocked",
                column: "User2Id",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_UserFollowers_Users_UserId",
                table: "UserFollowers",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_UserBlocked_Users_User2Id",
                table: "UserBlocked");

            migrationBuilder.DropForeignKey(
                name: "FK_UserFollowers_Users_UserId",
                table: "UserFollowers");

            migrationBuilder.DropTable(
                name: "UserFollowing");

            migrationBuilder.RenameColumn(
                name: "UserId",
                table: "UserFollowers",
                newName: "FollowingId");

            migrationBuilder.RenameIndex(
                name: "IX_UserFollowers_UserId",
                table: "UserFollowers",
                newName: "IX_UserFollowers_FollowingId");

            migrationBuilder.RenameColumn(
                name: "User2Id",
                table: "UserBlocked",
                newName: "UserId");

            migrationBuilder.RenameIndex(
                name: "IX_UserBlocked_User2Id",
                table: "UserBlocked",
                newName: "IX_UserBlocked_UserId");

            migrationBuilder.AddForeignKey(
                name: "FK_UserBlocked_Users_UserId",
                table: "UserBlocked",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_UserFollowers_Users_FollowingId",
                table: "UserFollowers",
                column: "FollowingId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
