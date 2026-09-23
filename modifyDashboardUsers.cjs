const fs = require('fs');
let code = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf8');

// 1. Manage Users tab button
const manageUsersTabTarget = `          Manage Users
        </button>`;
const manageUsersTabReplacement = `          Manage Users {totalUsersCount > 0 && <span className="ml-1.5 px-1.5 py-0.5 rounded-md bg-indigo-100 text-indigo-600 text-xs">{totalUsersCount}</span>}
        </button>`;
code = code.replace(manageUsersTabTarget, manageUsersTabReplacement);

// 2. Load more button
const loadMoreBtnTarget = `                  </tr>
                ))}
              </tbody>
            </table>
          </div>`;
const loadMoreBtnReplacement = `                  </tr>
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
          </div>`;
code = code.replace(loadMoreBtnTarget, loadMoreBtnReplacement);

fs.writeFileSync('src/pages/AdminDashboard.tsx', code);
