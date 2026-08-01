-- Rebuild the public default Plays from migration 030.
-- Removing its marker makes the migration runner execute 030 again on the
-- next application start, using its complete 500-question catalog.

delete from games
where is_public = true;

delete from schema_migrations
where version = '030_categories_and_unique_default_plays.sql';
