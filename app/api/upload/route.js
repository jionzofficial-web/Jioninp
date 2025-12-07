import { NextResponse } from 'next/server';
import imagekit from '@/lib/imagekit';

// POST upload image to ImageKit
export async function POST(req) {
    try {
        const formData = await req.formData();
        const file = formData.get('file');
        const fileName = formData.get('fileName') || file.name;
        const folder = formData.get('folder') || '/products';

        if (!file) {
            return NextResponse.json({ success: false, message: 'No file provided' }, { status: 400 });
        }

        // Convert file to buffer
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Upload to ImageKit
        const result = await new Promise((resolve, reject) => {
            imagekit.upload({
                file: buffer,
                fileName: fileName,
                folder: folder,
            }, function (error, result) {
                if (error) reject(error);
                else resolve(result);
            });
        });

        return NextResponse.json({
            success: true,
            data: {
                imagekit_id: result.fileId,
                url: result.url,
                thumbnail_url: result.thumbnailUrl,
                name: result.name,
            },
        });
    } catch (error) {
        console.error('ImageKit upload error:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

// GET authentication parameters for client-side upload
export async function GET() {
    try {
        const authParams = imagekit.getAuthenticationParameters();
        return NextResponse.json({ success: true, data: authParams });
    } catch (error) {
        console.error('ImageKit auth error:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
