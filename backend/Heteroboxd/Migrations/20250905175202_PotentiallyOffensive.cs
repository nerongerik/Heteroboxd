using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Heteroboxd.Migrations
{
    /// <inheritdoc />
    public partial class PotentiallyOffensive : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "BackdropUrlLocked",
                table: "Films",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "PosterUrlLocked",
                table: "Films",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "SynopsisLocked",
                table: "Films",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "TitleLocked",
                table: "Films",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "DescriptionLocked",
                table: "Celebrities",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "LastSync",
                table: "Celebrities",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "NameLocked",
                table: "Celebrities",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "PictureUrlLocked",
                table: "Celebrities",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "BackdropUrlLocked",
                table: "Films");

            migrationBuilder.DropColumn(
                name: "PosterUrlLocked",
                table: "Films");

            migrationBuilder.DropColumn(
                name: "SynopsisLocked",
                table: "Films");

            migrationBuilder.DropColumn(
                name: "TitleLocked",
                table: "Films");

            migrationBuilder.DropColumn(
                name: "DescriptionLocked",
                table: "Celebrities");

            migrationBuilder.DropColumn(
                name: "LastSync",
                table: "Celebrities");

            migrationBuilder.DropColumn(
                name: "NameLocked",
                table: "Celebrities");

            migrationBuilder.DropColumn(
                name: "PictureUrlLocked",
                table: "Celebrities");
        }
    }
}
