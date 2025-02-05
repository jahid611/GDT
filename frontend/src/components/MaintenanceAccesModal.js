function MaintenanceAccessModal({ open, onConfirm, onReject }) {
    if (!open) return null;
    
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="bg-white dark:bg-gray-900 rounded-xl shadow-xl p-6 sm:p-8 max-w-lg w-full mx-4 relative"
        >
          <div className="absolute top-3 right-3">
            <button 
              onClick={onReject} 
              className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            >
              ✖
            </button>
          </div>
  
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4 text-center">
            🔧 Accès à la Maintenance
          </h2>
          
          <p className="text-gray-600 dark:text-gray-300 text-center mb-6">
            Seuls les membres de l'équipe de maintenance peuvent accéder à cette section.  
            Confirmez-vous en faire partie ?
          </p>
  
          <div className="flex justify-center gap-3 sm:gap-4">
            <Button 
              variant="outline"
              className="border border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              onClick={onReject}
            >
              ❌ Non, je ne suis pas membre
            </Button>
  
            <Button 
              className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2 rounded-lg transition-all"
              onClick={onConfirm}
            >
              ✅ Oui, je suis membre
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }
  