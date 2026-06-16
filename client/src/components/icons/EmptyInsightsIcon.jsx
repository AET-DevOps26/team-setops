export default function EmptyInsightsIcon({
	className = "empty-icon",
	...props
}) {
	return (
		<svg
			className={className}
			viewBox="0 0 64 64"
			aria-hidden="true"
			{...props}
		>
			<path
				d="M22 26a10 10 0 0 1 20 0c0 7-6 8-6 14H28c0-6-6-7-6-14z"
				fill="none"
				stroke="currentColor"
				strokeWidth="3"
			/>
			<path
				d="M26 44h12M24 50h16"
				fill="none"
				stroke="currentColor"
				strokeWidth="3"
			/>
			<path
				d="M14 28h6M44 28h6M32 12v6"
				fill="none"
				stroke="currentColor"
				strokeWidth="3"
			/>
		</svg>
	);
}
