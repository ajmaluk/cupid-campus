import { useStore } from '../store/useStore';

export default function Matches() {
  const { matches } = useStore();

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Matches</h1>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {matches.map(match => (
            <div key={match.id} className="relative aspect-[3/4] rounded-2xl overflow-hidden group">
              <img src={match.profile?.primary_photo} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-4">
                <span className="font-bold">{match.profile?.name}</span>
              </div>
            </div>
          ))}
          {matches.length === 0 && (
             <p className="text-gray-500 col-span-2 text-center mt-10">No matches yet. Keep swiping!</p>
          )}
        </div>
      </div>
    </div>
  );
}
