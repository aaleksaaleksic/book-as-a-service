import ReaderView from '@/components/reader/ReaderView';

interface ReaderPageProps {
    params: Promise<{ bookId: string }>;
}

export default async function ReaderPage({ params }: ReaderPageProps) {
    const { bookId } = await params;
    const parsedBookId = Number(bookId);

    return <ReaderView bookId={Number.isNaN(parsedBookId) ? 0 : parsedBookId} />;
}
