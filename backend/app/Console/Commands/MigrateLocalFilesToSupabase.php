<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;

class MigrateLocalFilesToSupabase extends Command
{
    protected $signature = 'pcms:migrate-local-storage
        {--dry-run : List what would be uploaded without actually uploading}';

    protected $description = 'Upload existing files from storage/app/public to the configured Supabase (S3) public disk';

    public function handle(): int
    {
        $localRoot = storage_path('app/public');

        if (!File::isDirectory($localRoot)) {
            $this->error("Local storage folder not found: {$localRoot}");
            return self::FAILURE;
        }

        if (config('filesystems.disks.public.driver') !== 's3') {
            $this->error('PUBLIC_DISK_DRIVER is not "s3" right now. Set PUBLIC_DISK_DRIVER=s3 in .env, run php artisan config:clear, then re-run this command.');
            return self::FAILURE;
        }

        $files = File::allFiles($localRoot);
        $dryRun = $this->option('dry-run');

        $this->info(sprintf('Found %d file(s) under %s', count($files), $localRoot));

        $uploaded = 0;
        $skipped = 0;
        $failed = 0;

              $normalizedRoot = rtrim(str_replace('\\', '/', $localRoot), '/');

        foreach ($files as $file) {
            $fullPath = str_replace('\\', '/', $file->getPathname());
            $relativePath = ltrim(str_replace($normalizedRoot, '', $fullPath), '/');
            if (str_starts_with(basename($relativePath), '.')) {
                continue;
            }

            if ($dryRun) {
                $this->line("Would upload: {$relativePath}");
                continue;
            }

            try {
                if (Storage::disk('public')->exists($relativePath)) {
                    $this->line("Already exists in Supabase, skipping: {$relativePath}");
                    $skipped++;
                    continue;
                }

                $stream = fopen($file->getPathname(), 'r');
                Storage::disk('public')->put($relativePath, $stream, 'public');
                if (is_resource($stream)) {
                    fclose($stream);
                }

                $this->info("Uploaded: {$relativePath}");
                $uploaded++;
             } catch (\Throwable $e) {
                $detail = $e->getMessage();
                $prev = $e->getPrevious();
                while ($prev) {
                    $detail .= ' | caused by: ' . $prev->getMessage();
                    $prev = $prev->getPrevious();
                }
                $this->error("Failed: {$relativePath} — {$detail}");
                $failed++;
            }
        }

        if (!$dryRun) {
            $this->newLine();
            $this->info("Done. Uploaded: {$uploaded}, Skipped (already present): {$skipped}, Failed: {$failed}");
        }

        return self::SUCCESS;
    }
}