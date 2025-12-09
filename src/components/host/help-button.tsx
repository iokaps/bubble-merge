import { config } from '@/config';
import { KmModalProvider } from '@kokimoki/shared';
import { CircleHelp } from 'lucide-react';
import * as React from 'react';
import ReactMarkdown from 'react-markdown';

export const HelpButton: React.FC = () => {
	const [isOpen, setIsOpen] = React.useState(false);

	return (
		<>
			<button
				onClick={() => setIsOpen(true)}
				className="bg-primary-500 flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-white hover:brightness-90"
				aria-label={config.helpButtonLabel}
			>
				<CircleHelp size={18} />
				{config.helpButtonLabel}
			</button>

			{isOpen && (
				<KmModalProvider>
					<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
						<div className="scrollable bg-surface max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-lg shadow-xl">
							<div className="border-primary-200 sticky top-0 flex items-center justify-between border-b bg-white p-6">
								<h2 className="text-2xl font-bold">{config.helpTitle}</h2>
								<button
									onClick={() => setIsOpen(false)}
									className="text-text-muted hover:text-text-primary text-2xl font-bold"
									aria-label="Close"
								>
									×
								</button>
							</div>
							<div className="prose prose-lg max-w-none p-6">
								<ReactMarkdown>{config.helpContentMd}</ReactMarkdown>
							</div>
						</div>
					</div>
				</KmModalProvider>
			)}
		</>
	);
};
