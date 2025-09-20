import ReaderView from '@/components/reader/ReaderView';

interface ReaderPageProps {
    params: { bookId: string };
}

export default function ReaderPage({ params }: ReaderPageProps) {
    const bookId = Number(params.bookId);
    return <ReaderView bookId={Number.isNaN(bookId) ? 0 : bookId} />;
}
