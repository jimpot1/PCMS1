<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureDeleteIsAdmin
{
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->isMethod('DELETE') && $request->user()?->role !== 'System Administrator') {
            return response()->json([
                'message' => 'Only a System Administrator can delete system records.',
            ], 403);
        }

        return $next($request);
    }
}