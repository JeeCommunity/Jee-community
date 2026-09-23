const fs = require('fs');
let code = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf8');

// Undo the wrong replacement
const wrongLoadMoreTarget = `            </table>
            {usersHasMore && (
              <div className="p-4 flex justify-center border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={handleLoadMoreUsers}
                  disabled={usersLoadingMore}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
                >
                  {usersLoadingMore ? 'Loading...' : 'Load More Users'}
                </button>
              </div>
            )}
          </div>
        ) : activeTab === 'users' ? (`;

const wrongLoadMoreReplacement = `            </table>
          </div>
        ) : activeTab === 'users' ? (`;

code = code.replace(wrongLoadMoreTarget, wrongLoadMoreReplacement);

// Do the correct replacement
const correctLoadMoreTarget = `                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : activeTab === 'reports' ? (`;

const correctLoadMoreReplacement = `                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {usersHasMore && (
              <div className="p-4 flex justify-center border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={handleLoadMoreUsers}
                  disabled={usersLoadingMore}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
                >
                  {usersLoadingMore ? 'Loading...' : 'Load More Users'}
                </button>
              </div>
            )}
          </div>
        ) : activeTab === 'reports' ? (`;

if (code.includes(correctLoadMoreTarget)) {
  code = code.replace(correctLoadMoreTarget, correctLoadMoreReplacement);
} else {
  console.error("correctLoadMoreTarget not found!");
}

fs.writeFileSync('src/pages/AdminDashboard.tsx', code);
